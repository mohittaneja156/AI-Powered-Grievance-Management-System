import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'


const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

if (!API_KEY) {
  console.error("Gemini API key is not set. Please check your .env file and ensure the correct prefix.");

}

// Initialize Gemini AI with the API key from .env
const genAI = new GoogleGenerativeAI(API_KEY);

// --- Model Update: Changed to 'gemini-1.5-flash' for responsiveness ---
// You can switch back to 'gemini-pro' if preferred for its capabilities,
// but 'flash' is generally faster for these types of classifications.
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


const determinePriority = async (issueType, issueDetails) => {
  if (!issueType || !issueDetails) {
    throw new Error('Issue type and details are required');
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

    // Validate priority without defaulting
    if (!['high', 'medium', 'low'].includes(priority)) {
      console.error('Invalid priority response from AI:', priority);
      throw new Error('Could not determine priority level');
    }
    
    return priority;
  } catch (error) {
    console.error('Error determining priority:', error);
    throw error; // Propagate the error up instead of handling it here
  }
}

function JalBoardComplaint() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    district: '',
    pincode: '',
    landmark: '',
    issueType: '',
    issueDetails: '',
    duration: '',
    preferredTime: '',
    previousComplaint: '',
    idProofType: '',
    idProofNumber: '',
    photos: [],
    idProofFile: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (name === 'photos') {
      setFormData(prev => ({ 
        ...prev, 
        photos: [...prev.photos, ...Array.from(files)]
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: files[0] }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.district) newErrors.district = 'District is required'
    if (!/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = 'Valid 6-digit pincode is required'
    if (!formData.issueType) newErrors.issueType = 'Issue type is required'
    if (!formData.issueDetails.trim()) newErrors.issueDetails = 'Issue details are required'
    if (!formData.duration) newErrors.duration = 'Duration is required'
    if (!formData.idProofType) newErrors.idProofType = 'ID proof type is required'
    if (!formData.idProofNumber.trim()) newErrors.idProofNumber = 'ID proof number is required'
    if (!formData.idProofFile) newErrors.idProofFile = 'ID proof document is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateComplaintId = () => {
    const prefix = 'JB';
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 random alpha-numeric chars
    return `${prefix}${timestamp}${random}`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      window.scrollTo(0, 0) // Scroll to top to show errors
      return
    }

    setIsSubmitting(true)

    try {
      // Determine complaint priority using AI
      const priority = await determinePriority(formData.issueType, formData.issueDetails)

      // Create complaint object
      const complaintData = {
        ...formData,
        complaintId: generateComplaintId(),
        priority,
        status: 'registered',
        timestamp: new Date().toISOString(),
        expectedResponse: priority === 'high' ? '24 hours' : priority === 'medium' ? '48 hours' : '72 hours'
      }

      // Log the complaint data (replace with actual API call to your backend in production)
      console.log('New Complaint:', complaintData)

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        district: '',
        pincode: '',
        landmark: '',
        issueType: '',
        issueDetails: '',
        duration: '',
        preferredTime: '',
        previousComplaint: '',
        idProofType: '',
        idProofNumber: '',
        photos: [],
        idProofFile: null
      })

      // Show success message
      alert(`Complaint registered successfully!\nComplaint ID: ${complaintData.complaintId}`)

    } catch (error) {
      console.error('Error submitting complaint:', error)
      alert(`Error submitting complaint: ${error.message}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
       {/* Smart Assistant Card */}
       <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-blue-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
              <p className="text-sm text-gray-600">
                I'll help analyze your water issue and prioritize it based on severity
              </p>
            </div>
          </div>
        </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-400 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl">💧</span>
            </div>
            <div>
              <h1 className="text-white text-2xl font-semibold">Water Supply Complaint</h1>
              <p className="text-blue-100">UP Jal Board | Smart Complaint System</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">District *</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select District</option>
                  <option value="lucknow">Lucknow</option>
                  <option value="kanpur">Kanpur</option>
                  <option value="varanasi">Varanasi</option>
                  {/* Add more districts */}
                </select>
                {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Address Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Complete Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Complaint Details Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Complaint Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type of Issue *</label>
                <select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Issue Type</option>
                  <option value="No Water Supply">No Water Supply</option>
                  <option value="Low Pressure">Low Pressure</option>
                  <option value="Contaminated Water">Contaminated Water</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Other">Other</option>
                </select>
                {errors.issueType && <p className="text-red-500 text-sm mt-1">{errors.issueType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duration of Issue *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="Today">Today</option>
                  <option value="Few Days">Few Days</option>
                  <option value="More than a week">More than a week</option>
                  <option value="More than a month">More than a month</option>
                </select>
                {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Detailed Description *</label>
                <textarea
                  name="issueDetails"
                  value={formData.issueDetails}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide detailed information about the issue..."
                  required
                />
                {errors.issueDetails && <p className="text-red-500 text-sm mt-1">{errors.issueDetails}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Inspection Time</label>
                <select
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Time Slot</option>
                  <option value="Morning (9AM-12PM)">Morning (9AM-12PM)</option>
                  <option value="Afternoon (12PM-3PM)">Afternoon (12PM-3PM)</option>
                  <option value="Evening (3PM-6PM)">Evening (3PM-6PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Previous Complaint Reference</label>
                <input
                  type="text"
                  name="previousComplaint"
                  value={formData.previousComplaint}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="If any"
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Required Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Proof Type *</label>
                <select
                  name="idProofType"
                  value={formData.idProofType}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select ID Proof</option>
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="Voter">Voter ID</option>
                  <option value="Driving">Driving License</option>
                  <option value="Passport">Passport</option>
                </select>
                {errors.idProofType && <p className="text-red-500 text-sm mt-1">{errors.idProofType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ID Proof Number *</label>
                <input
                  type="text"
                  name="idProofNumber"
                  value={formData.idProofNumber}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.idProofNumber && <p className="text-red-500 text-sm mt-1">{errors.idProofNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Upload ID Proof *</label>
                <input
                  type="file"
                  name="idProofFile"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="mt-1 w-full"
                  required
                />
                {errors.idProofFile && <p className="text-red-500 text-sm mt-1">{errors.idProofFile}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Photos of Issue</label>
                <input
                  type="file"
                  name="photos"
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="mt-1 w-full"
                />
                <p className="text-sm text-gray-500 mt-1">You can upload multiple photos</p>
              </div>
            </div>
          </div>

          {/* Safety Alert Section (Consider adding one if relevant for water issues) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-600 mb-2">
                <span className="text-xl">⚠️</span>
                <h3 className="font-semibold">Important Notice!</h3>
              </div>
              <p className="text-sm text-blue-600">
                If you are experiencing severe water contamination, sewage overflow, or a burst main causing significant damage, please contact emergency services immediately.
              </p>
            </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors duration-200 flex items-center space-x-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Submit Complaint</span>
              )}
            </button>
          </div>
        </form>
      </div>

       {/* Quick Info Cards */}
       <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
            <div className="flex items-center space-x-3 text-blue-600 mb-2">
              <span className="text-xl">⏰</span>
              <h3 className="font-semibold">Timely Support</h3>
            </div>
            <p className="text-sm text-gray-600">
              Complaints are addressed with priority based on urgency.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
            <div className="flex items-center space-x-3 text-blue-600 mb-2">
              <span className="text-xl">📍</span>
              <h3 className="font-semibold">Local Teams</h3>
            </div>
            <p className="text-sm text-gray-600">
              Our teams are dispatched to your district for efficient service.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
            <div className="flex items-center space-x-3 text-blue-600 mb-2">
              <span className="text-xl">⚙️</span>
              <h3 className="font-semibold">Systematic Tracking</h3>
            </div>
            <p className="text-sm text-gray-600">
              Receive a unique complaint ID for easy status tracking.
            </p>
          </div>
        </div>
    </div>
  )
}

export default JalBoardComplaint