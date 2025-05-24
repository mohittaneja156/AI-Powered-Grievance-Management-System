import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- KEY CHANGE: Access API key from process.env ---
// Ensure your .env file has VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
// And restart your development server after creating/modifying .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // For Vite projects

if (!API_KEY) {
  console.error("Gemini API key is not set. Please check your .env file and ensure the correct prefix (e.g., VITE_GEMINI_API_KEY).");
  // In a production app, you might want to disable AI features or show a user-friendly error.
}

// Initialize Gemini AI with the API key from .env
const genAI = new GoogleGenerativeAI(API_KEY);

// --- Model Update: Changed to 'gemini-1.5-flash' for responsiveness ---
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const departmentQuestions = {
  'jal-board': {
    en: [
      { id: 'issueType', question: "What type of water supply issue are you facing?", options: ["No Water Supply", "Low Pressure", "Contaminated Water", "Water Leakage"] },
      { id: 'duration', question: "How long has this issue been occurring?", options: ["Today", "Few Days", "More than a week", "More than a month"] },
      { id: 'address', question: "Please provide your complete address:", type: "textarea" },
      { id: 'name', question: "Your name:", type: "text" },
      { id: 'contact', question: "Contact number:", type: "tel", validation: (value) => /^[0-9]{10}$/.test(value), placeholder: '10-digit mobile number' },
      { id: 'email', question: "Email (optional):", type: "email", optional: true },
      { id: 'landmark', question: "Landmark near your location:", type: "text" },
      { id: 'preferredTime', question: "Best time to visit for inspection:", options: ["Morning (9AM-12PM)", "Afternoon (12PM-3PM)", "Evening (3PM-6PM)"] },
      { id: 'previousReference', question: "Any previous complaint reference?", type: "text", optional: true },
      { id: 'additionalDetails', question: "Additional details about the issue:", type: "textarea" }
    ],
    hi: [
      { id: 'issueType', question: "आप किस प्रकार की जल आपूर्ति समस्या का सामना कर रहे हैं?", options: ["पानी की आपूर्ति नहीं", "कम दबाव", "दूषित पानी", "पानी का रिसाव"] },
      { id: 'duration', question: "यह समस्या कब से हो रही है?", options: ["आज", "कुछ दिनों से", "एक सप्ताह से अधिक", "एक महीने से अधिक"] },
      { id: 'address', question: "कृपया अपने पूरे पता बताएं:", type: "textarea" },
      { id: 'name', question: "आपका नाम है:", type: "text" },
      { id: 'contact', question: "संपर्क नंबर:", type: "tel", validation: (value) => /^[0-9]{10}$/.test(value), placeholder: '10 अंकों का मोबाइल नंबर' },
      { id: 'email', question: "ईमेल (वैकल्पिक):", type: "email", optional: true },
      { id: 'landmark', question: "आपके स्थान के पास का लैंडमार्क:", type: "text" },
      { id: 'preferredTime', question: "जाँच के लिए आपको कब यात्रा करनी चाहिए:", options: ["सुबह (9AM-12PM)", "दोपहर (12PM-3PM)", "शाम (3PM-6PM)"] },
      { id: 'previousReference', question: "क्या पिछली आयात का संदर्भ है?", type: "text", optional: true },
      { id: 'additionalDetails', question: "समस्या के बारे में कोई अतिरिक्त विवरण:", type: "textarea" }
    ]
  },
  // ... other departments
};

// Add district options
const districtOptions = {
  hi: [
    'लखनऊ', 'कानपुर', 'वाराणसी', 'प्रयागराज', 'आगरा', 
    'गोरखपुर', 'मेरठ', 'गाजियाबाद', 'नोएडा', 'बरेली'
  ],
  en: [
    'Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj', 'Agra', 
    'Gorakhpur', 'Meerut', 'Ghaziabad', 'Noida', 'Bareilly'
  ]
};

const initialQuestions = {
  hi: [
    { 
      id: 'name', 
      question: 'कृपया अपना नाम बताएं:', 
      type: 'text',
      validation: (value) => value.length >= 3,
      placeholder: 'आपका पूरा नाम'
    },
    { 
      id: 'phone', 
      question: 'अपना मोबाइल नंबर दर्ज करें:', 
      type: 'tel',
      validation: (value) => /^[0-9]{10}$/.test(value),
      placeholder: '10 अंकों का मोबाइल नंबर'
    },
    { 
      id: 'district', 
      question: 'अपना जिला चुनें:', 
      type: 'select',
      options: districtOptions.hi
    },
    { 
      id: 'pincode', 
      question: 'पिनकोड दर्ज करें:', 
      type: 'number',
      validation: (value) => /^[0-9]{6}$/.test(value),
      placeholder: '6 अंकों का पिनकोड'
    },
    { 
      id: 'address', 
      question: 'विस्तृत पता दर्ज करें:', 
      type: 'textarea',
      validation: (value) => value.length >= 10,
      placeholder: 'मकान नंबर, मोहल्ला, लैंडमार्क आदि'
    },
    { 
      id: 'issueType', 
      question: 'आपकी मुख्य समस्या क्या है?', 
      type: 'select',
      options: departmentQuestions['jal-board'].hi.find(q => q.id === 'issueType').options
    },
    { 
      id: 'duration', 
      question: 'यह समस्या कब से हो रही है?', 
      type: 'select',
      options: departmentQuestions['jal-board'].hi.find(q => q.id === 'duration').options
    },
    {
      id: 'additionalDetails',
      question: 'कृपया समस्या का विस्तृत विवरण दें:',
      type: 'textarea',
      validation: (value) => value.length >= 10,
      placeholder: 'समस्या के बारे में अधिक जानकारी'
    },
    { 
      id: 'preferredTime', 
      question: 'जाँच के लिए आपको कब यात्रा करनी चाहिए:', 
      type: 'select',
      options: departmentQuestions['jal-board'].hi.find(q => q.id === 'preferredTime').options
    },
    { 
      id: 'landmark', 
      question: 'आपके स्थान के पास का लैंडमार्क (वैकल्पिक):', 
      type: 'text', 
      optional: true 
    },
    { 
      id: 'previousReference', 
      question: 'पिछली शिकायत का कोई संदर्भ नंबर (वैकल्पिक):', 
      type: 'text', 
      optional: true 
    },
    { 
      id: 'email', 
      question: 'आपका ईमेल पता (वैकल्पिक):', 
      type: 'email', 
      optional: true 
    }
  ],
  en: [
    { 
      id: 'name', 
      question: 'Please enter your name:', 
      type: 'text',
      validation: (value) => value.length >= 3,
      placeholder: 'Your full name'
    },
    { 
      id: 'phone', 
      question: 'Enter your mobile number:', 
      type: 'tel',
      validation: (value) => /^[0-9]{10}$/.test(value),
      placeholder: '10-digit mobile number'
    },
    { 
      id: 'district', 
      question: 'Select your district:', 
      type: 'select',
      options: districtOptions.en
    },
    { 
      id: 'pincode', 
      question: 'Enter pincode:', 
      type: 'number',
      validation: (value) => /^[0-9]{6}$/.test(value),
      placeholder: '6-digit pincode'
    },
    { 
      id: 'address', 
      question: 'Enter detailed address:', 
      type: 'textarea',
      validation: (value) => value.length >= 10,
      placeholder: 'House No, Locality, Landmark etc.'
    },
    { 
      id: 'issueType', 
      question: 'What is your main issue?', 
      type: 'select',
      options: departmentQuestions['jal-board'].en.find(q => q.id === 'issueType').options
    },
    { 
      id: 'duration', 
      question: 'How long has this issue been occurring?', 
      type: 'select',
      options: departmentQuestions['jal-board'].en.find(q => q.id === 'duration').options
    },
    {
      id: 'additionalDetails',
      question: 'Please provide a detailed description of the issue:',
      type: 'textarea',
      validation: (value) => value.length >= 10,
      placeholder: 'More details about the problem'
    },
    { 
      id: 'preferredTime', 
      question: 'Best time for inspection:', 
      type: 'select',
      options: departmentQuestions['jal-board'].en.find(q => q.id === 'preferredTime').options
    },
    { 
      id: 'landmark', 
      question: 'Landmark near your location (optional):', 
      type: 'text', 
      optional: true 
    },
    { 
      id: 'previousReference', 
      question: 'Any previous complaint reference number (optional):', 
      type: 'text', 
      optional: true 
    },
    { 
      id: 'email', 
      question: 'Your email address (optional):', 
      type: 'email', 
      optional: true 
    }
  ]
};

const determinePriority = async (issueType, issueDetails) => {
  if (!issueType || !issueDetails) {
    console.warn("Missing issueType or issueDetails for AI priority determination, defaulting to 'medium'.");
    return 'medium';
  }

  try {
    const prompt = `
      As a water utility expert, analyze this water-related issue and classify its priority as 'high', 'medium', or 'low'.
      
      Issue Type: ${issueType}
      Details: ${issueDetails}
      
      Classification Rules:
      HIGH priority if:
      - Complete water supply disruption
      - Water contamination issues (bad smell, color, health hazards)
      - Sewage overflow or burst water mains
      
      MEDIUM priority if:
      - Low water pressure
      - Minor leakages or intermittent supply issues
      - Pipeline repairs or water meter problems
      
      LOW priority if:
      - General inquiries or billing questions
      - Future connection requests or minor maintenance
      - Information updates
      
      Based on the above criteria, respond with exactly one word (high/medium/low):
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const priority = response.text().trim().toLowerCase();
    
    console.log('AI determined priority:', priority);

    if (!['high', 'medium', 'low'].includes(priority)) {
      console.warn('Invalid priority response from AI:', priority, "Defaulting to 'medium'.");
      return 'medium'; // Fallback if AI gives an unexpected response
    }
    
    return priority;
  } catch (error) {
    console.error('Error determining priority:', error);
    return 'medium'; // Default fallback on AI API error
  }
};

// --- START: Memoized InputField Component ---
// Moved outside ServiceChatbot to prevent unnecessary re-renders and focus loss
const InputField = React.memo(({ currentQuestion, inputMessage, handleInputChange, handleImageUpload, handleUserResponse, isProcessing, language }) => {
    if (!currentQuestion) return null; // Safety check

    switch (currentQuestion.type) {
      case 'select':
        return (
          <div className="relative w-full">
            <select
              value={inputMessage}
              onChange={(e) => {
                handleInputChange(e); // Update inputMessage for display
                handleUserResponse(e.target.value); // Immediately process selection as response
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 
                         focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                         text-gray-700 appearance-none bg-white"
              disabled={isProcessing}
            >
              <option value="">{language === 'hi' ? 'चुनें' : 'Select'}</option>
              {currentQuestion.options?.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={currentQuestion.placeholder || (language === 'hi' ? 'यहाँ टाइप करें...' : 'Type here...')}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 
                       focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                       placeholder-gray-400 text-gray-700 resize-none"
            disabled={isProcessing}
          />
        );

      case 'file': // If you add file upload (not currently used in chat flow, but ready)
        return (
          <input
            type="file"
            name={currentQuestion.id}
            onChange={handleImageUpload} // Using your existing handler
            accept="image/*,.pdf" // Example: images and PDFs
            className="w-full px-4 py-3 rounded-xl border border-gray-200 
                        focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                        text-gray-700"
            disabled={isProcessing}
          />
        );

      default: // Handles 'text', 'tel', 'number', 'email'
        return (
          <input
            type={currentQuestion.type || 'text'}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isProcessing) {
                handleUserResponse(inputMessage);
              }
            }}
            placeholder={currentQuestion.placeholder || (language === 'hi' ? 'अपनी प्रतिक्रिया यहाँ दर्ज करें...' : 'Enter your response here...')}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 
                        focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                        placeholder-gray-400 text-gray-700"
            disabled={isProcessing}
          />
        );
    }
}); // <--- CRITICAL: This closes the React.memo wrapper and the functional component
// --- END: Memoized InputField Component ---


function ServiceChatbot() {
  const chatEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { departmentId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [language, setLanguage] = useState('hi'); // Default to Hindi
  const [messages, setMessages] = useState([]);
  const [inputError, setInputError] = useState('');

  // Questions array based on selected language
  const questionsForChat = initialQuestions[language];

  // Initialize chat with the first question
  useEffect(() => {
    // Check if questionsForChat is defined and has elements
    if (questionsForChat && questionsForChat.length > 0) {
      setMessages([{
        type: 'bot',
        content: questionsForChat[0].question,
        options: questionsForChat[0].type === 'select' ? questionsForChat[0].options : undefined
      }]);
      setCurrentQuestionIndex(0);
      setUserResponses({});
      setIsChatComplete(false);
      setInputMessage('');
      setInputError('');
    }
  }, [departmentId, language, questionsForChat]); 

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateComplaintId = () => {
    const prefix = 'JB'; // Changed prefix for better identification
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const validateInput = (value) => {
    const currentQuestion = questionsForChat[currentQuestionIndex];
    if (!currentQuestion) return true; // Safety check
    
    if (currentQuestion.optional && !value.trim()) {
        return true; // Optional field and empty is valid
    }

    if (currentQuestion.validation) {
      return currentQuestion.validation(value);
    }
    
    // For non-optional fields without specific validation, it's valid if not empty
    if (!currentQuestion.optional && !value.trim()) {
        return false;
    }
    return true;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    setInputError('');
  };

  const handleUserResponse = async (response) => {
    setIsProcessing(true);
    setInputError('');

    const currentQuestion = questionsForChat[currentQuestionIndex];

    // Handle empty response for optional fields directly
    if (currentQuestion.optional && !response.trim()) {
        setUserResponses(prev => ({
            ...prev,
            [currentQuestion.id]: response.trim() // Save as empty string
        }));
        setMessages(prev => [...prev, {
            type: 'user',
            content: language === 'hi' ? 'कोई जानकारी नहीं' : 'No information provided'
        }]);
        moveToNextQuestion();
        return; // Exit here as response is handled
    }

    // Validate non-empty responses (including optional fields if they have a value)
    if (!validateInput(response)) {
      setInputError(language === 'hi' 
        ? 'यह जानकारी आवश्यक है और सही प्रारूप में होनी चाहिए।'
        : 'This information is required and must be in a valid format.'
      );
      setIsProcessing(false);
      return;
    }
    
    // Save user's response
    setUserResponses(prev => ({
      ...prev,
      [currentQuestion.id]: response.trim()
    }));

    // Add user's response to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: response.trim()
    }]);

    moveToNextQuestion();
  };

  const moveToNextQuestion = async () => {
    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex === questionsForChat.length) {
      // Chat complete
      const complaintId = generateComplaintId();
      const timestamp = new Date().toISOString();
      
      // Determine priority using AI for the collected issue details
      const combinedIssueDetails = `${userResponses.issueType || ''}. ${userResponses.additionalDetails || ''}`;
      const priority = await determinePriority(userResponses.issueType, combinedIssueDetails);
      
      // Create detailed complaint object
      const complaintDetails = {
        complaintId,
        ...userResponses, // Spreads all collected user responses
        timestamp,
        status: 'registered',
        priority,
        expectedResolutionTime: priority === 'high' ? '24 hours' : priority === 'medium' ? '48 hours' : '72 hours'
      };
      
      // Log complete complaint details (replace with actual API call)
      console.log('New Complaint:', complaintDetails);

      // Show success message
      setMessages(prev => [...prev, {
        type: 'success',
        content: {
          title: language === 'hi' ? 'शिकायत सफलतापूर्वक दर्ज की गई!' : 'Complaint Filed Successfully!',
          complaintId,
          subtitle: language === 'hi' 
            ? `आपकी शिकायत "${priority}" प्राथमिकता पर है।\nकृपया भविष्य में संदर्भ के लिए यह ID सहेज लें\nअनुमानित प्रतिक्रिया समय: ${complaintDetails.expectedResolutionTime}`
            : `Your complaint is of "${priority}" priority.\nPlease save this ID for future reference.\nExpected response time: ${complaintDetails.expectedResolutionTime}`
        }
      }]);

      setIsChatComplete(true);
      setInputMessage(''); // Clear input on completion
    } else {
      // Move to next question
      const nextQuestion = questionsForChat[nextQuestionIndex];

      setMessages(prev => [...prev, {
        type: 'bot',
        content: nextQuestion.question,
        options: nextQuestion.type === 'select' ? nextQuestion.options : undefined
      }]);
      setCurrentQuestionIndex(nextQuestionIndex);
      setInputMessage(''); // Clear input for next question
    }

    setIsProcessing(false);
  };

  // Add image upload handler (this is not directly used in the chatbot flow, but good to keep if needed later)
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    
    // This part should be integrated into userResponses or a dedicated file upload step if needed
    // For now, it just logs, as the chat flow does not prompt for images.
    console.log("Uploaded image URLs:", imageUrls);
  };

  // Add new success message component
  const SuccessMessage = ({ content }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm text-center">
      <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">{content.title}</h2>
      <p className="text-gray-600 mb-4">Your complaint ID is: <span className="font-mono font-bold">{content.complaintId}</span></p>
      <p className="text-sm text-gray-500 whitespace-pre-line">{content.subtitle}</p> {/* Use whitespace-pre-line for \n */}
    </div>
  );

  // New Chat Button Component
  const NewChatButton = () => (
    <button
      onClick={() => {
        // Reset all states to initial values
        setMessages([{
          type: 'bot',
          content: questionsForChat[0].question,
          options: questionsForChat[0].type === 'select' ? questionsForChat[0].options : undefined
        }]);
        setCurrentQuestionIndex(0);
        setUserResponses({});
        setIsChatComplete(false);
        setInputMessage('');
        setInputError('');
      }}
      className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 
                transition-colors flex items-center space-x-2"
    >
      <span>{language === 'hi' ? 'नई शिकायत दर्ज करें' : 'File New Complaint'}</span>
    </button>
  );

  const isSendButtonDisabled = () => {
    const currentQuestion = questionsForChat[currentQuestionIndex];
    if (!currentQuestion) return true; // Safety check

    if (isProcessing) return true;

    if (currentQuestion.type === 'select') {
        return false; // Select inputs handle their own submission via onChange
    }

    // For other types, check if required and empty
    if (!currentQuestion.optional && !inputMessage.trim()) {
        return true;
    }
    
    // If not optional, and has content, validate it before enabling
    if (!currentQuestion.optional && inputMessage.trim() && currentQuestion.validation && !currentQuestion.validation(inputMessage)) {
        return true;
    }

    return false; // Enabled by default if none of the above conditions met
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-100px)] flex flex-col">
      {/* Language Selector */}
      <div className="mb-4 flex justify-end">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg cursor-pointer"
        >
          <option value="hi">हिंदी</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-400 p-6 rounded-t-xl">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">
                {language === 'hi' ? 'सेवा सहायक' : 'Service Assistant'}
              </h2>
              <p className="text-yellow-100">
                {language === 'hi' ? 'ऑनलाइन | तुरंत प्रतिक्रिया' : 'Online | Quick Response'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 custom-scrollbar">
          {messages.map((message, index) => (
            <div key={index} 
                 className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'success' ? (
                <SuccessMessage content={message.content} />
              ) : (
                <>
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex-shrink-0 mr-3 
                                     flex items-center justify-center">
                      <span className="text-white text-sm">💬</span>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    message.type === 'user' 
                      ? 'bg-yellow-500 text-white ml-4' 
                      : 'bg-white border border-gray-100'
                  } shadow-md`}>
                    <p className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                      {message.content}
                    </p>
                    {/* Render buttons for options if current question is NOT a select type */}
                    {message.options && message.type === 'bot' && currentQuestionIndex < questionsForChat.length && questionsForChat[currentQuestionIndex].type !== 'select' && (
                        <div className="mt-4 space-y-2">
                            {message.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleUserResponse(option)} 
                                    className="w-full text-left px-4 py-3 rounded-xl 
                                             bg-yellow-50 hover:bg-yellow-100 
                                             text-gray-700 hover:text-yellow-800
                                             border border-yellow-200 
                                             transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={isProcessing}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-gray-500 px-4 py-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" 
                   style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" 
                   style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        {!isChatComplete && questionsForChat[currentQuestionIndex] && (
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-4">
              {/* Pass props to the memoized InputField */}
              <InputField
                currentQuestion={questionsForChat[currentQuestionIndex]}
                inputMessage={inputMessage}
                handleInputChange={handleInputChange}
                handleImageUpload={handleImageUpload} 
                handleUserResponse={handleUserResponse} 
                isProcessing={isProcessing}
                language={language}
              />
              {/* Only show send button for non-select inputs */}
              {questionsForChat[currentQuestionIndex].type !== 'select' && (
                <button
                  onClick={() => handleUserResponse(inputMessage)}
                  disabled={isSendButtonDisabled()}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-xl
                              hover:bg-yellow-600 transition-colors flex items-center space-x-2
                              disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{language === 'hi' ? 'भेजें' : 'Send'}</span>
                </button>
              )}
            </div>
            {inputError && (
              <p className="text-red-500 text-sm mt-2">{inputError}</p>
            )}
          </div>
        )}

        {isChatComplete && (
          <div className="p-4 bg-white border-t border-gray-100 flex justify-center">
            <NewChatButton />
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceChatbot;