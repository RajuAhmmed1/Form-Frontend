import { useState, useRef, useEffect } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import { useDropzone } from "react-dropzone";
import logo from "./assets/logo.jpg"; // Import the logo image

const Form = () => {
  const [userIp, setUserIp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [useOfFund, setUseOfFund] = useState("");
  const [bestContactNumber, setBestContactNumber] = useState("");
  const [businessStartDate, setBusinessStartDate] = useState(""); // New field
  const [owners, setOwners] = useState([
    { name: "", ssn: "", phone: "", email: "", percentage: "", address: "", signature: "", dateOfBirth: "" }, // Added dateOfBirth
  ]);
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [consentChecked, setConsentChecked] = useState(false);
  const sigCanvasRefs = useRef([]);

  // Handle file upload
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFiles([...files, ...acceptedFiles]);
      }
    },
  });



  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await axios.get("https://api.ipify.org?format=json");
        setUserIp(response.data.ip); // Store the IP address in state
      } catch (error) {
        console.error("Error fetching IP address:", error);
      }
    };
  
    fetchIp();
  }, []);


  useEffect(() => {
    if (fileRejections.length > 0) {
      setNotification({
        message: "Invalid file type. Please upload a valid image or PDF.",
        type: "error",
      });
    }
  }, [fileRejections]);

  // Remove a file
  const handleRemoveFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setNotification({
      message: "File removed successfully.",
      type: "success",
    });
  };

  // Handle owner details change
  const handleOwnerChange = (index, event) => {
    const values = [...owners];
    values[index][event.target.name] = event.target.value;
    setOwners(values);
  };

  // Handle ownership percentage change
  const handlePercentageChange = (index, event) => {
    const value = event.target.value;
    if (value === "") {
      const updatedOwners = [...owners];
      updatedOwners[index].percentage = "";
      setOwners(updatedOwners);
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    const updatedOwners = [...owners];
    updatedOwners[index].percentage = numericValue;

    const totalPercentage = updatedOwners.reduce(
      (sum, owner) => sum + parseFloat(owner.percentage || 0),
      0
    );

    if (totalPercentage < 51 && index === updatedOwners.length - 1) {
      updatedOwners.push({ name: "", ssn: "", phone: "", email: "", percentage: "", address: "", signature: "", dateOfBirth: "" });
    }

    if (totalPercentage >= 51) {
      let cumulativePercentage = 0;
      let cutoffIndex = 0;
      for (let i = 0; i < updatedOwners.length; i++) {
        cumulativePercentage += parseFloat(updatedOwners[i].percentage || 0);
        if (cumulativePercentage >= 51) {
          cutoffIndex = i + 1;
          break;
        }
      }
      updatedOwners.splice(cutoffIndex);
    }

    setOwners(updatedOwners);
  };

  // Clear signature
  const handleClearSignature = (index) => {
    sigCanvasRefs.current[index].clear();
    const updatedOwners = [...owners];
    updatedOwners[index].signature = "";
    setOwners(updatedOwners);
  };

  // Save signature
  const handleSignatureChange = (index) => {
    const signature = sigCanvasRefs.current[index].toDataURL();
    const updatedOwners = [...owners];
    updatedOwners[index].signature = signature;
    setOwners(updatedOwners);
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    // Business Info Validation
    if (!businessName) newErrors.businessName = "The business name is required.";
    if (!taxId) newErrors.taxId = "The business tax ID is required.";
    if (!fundAmount) newErrors.fundAmount = "The fund amount is required.";
    if (!bestContactNumber) newErrors.bestContactNumber = "The best contact number is required.";
    if (!businessStartDate) newErrors.businessStartDate = "The business start date is required.";

    // Owner Info Validation
    owners.forEach((owner, index) => {
      if (!owner.name) newErrors[`ownerName${index}`] = "The owner name is required.";
      if (!owner.ssn) newErrors[`ownerSsn${index}`] = "The owner SSN is required.";
      if (!owner.phone) newErrors[`ownerPhone${index}`] = "The owner phone number is required.";
      if (!owner.email) newErrors[`ownerEmail${index}`] = "The email is required.";
      if (!owner.percentage) newErrors[`ownerPercentage${index}`] = "The ownership percentage is required.";
      if (!owner.address) newErrors[`ownerAddress${index}`] = "The owner address is required.";
      if (!owner.dateOfBirth) newErrors[`ownerDateOfBirth${index}`] = "The owner date of birth is required.";
      if (owner.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) {
        newErrors[`ownerEmail${index}`] = "The email format is invalid.";
      }
    });

    // Consent Checkbox Validation
    if (!consentChecked) newErrors.consentChecked = "You must agree to the terms and conditions.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setNotification({
        message: "Please fix the errors in the form.",
        type: "warning",
      });
      return;
    }

    const totalPercentage = owners.reduce(
      (sum, owner) => sum + parseFloat(owner.percentage || 0),
      0
    );
    if (totalPercentage < 51) {
      setNotification({
        message: "Total ownership percentage must be at least 51%.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("businessName", businessName);
    formData.append("taxId", taxId);
    formData.append("fundAmount", fundAmount);
    formData.append("useOfFund", useOfFund);
    formData.append("bestContactNumber", bestContactNumber);
    formData.append("businessStartDate", businessStartDate); // Add business start date
    formData.append("owners", JSON.stringify(owners)); // Send owners as a JSON string
    formData.append("consentChecked", consentChecked); // Add consent checkbox value
    formData.append("userIp", userIp); // Add the user's IP address


    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.post(

        "https://dynamicforms-0wz2.onrender.com/submit",

        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setNotification({
        message: "Form submitted successfully! Your rep will contact you shortly.",
        type: "success",
      });

      setTimeout(() => {
        window.location.href = "https://drobyonline.com/";
      }, 4000);
    } catch (error) {
      console.error("Error:", error);
      setNotification({
        message: "There was an error submitting the form.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-6 bg-white shadow-md rounded-lg mt-2">
      {/* Logo */}
     <div className="flex flex-col items-center mb-6">
      <a href="https://drobyonline.com/" >
        <img src={logo} alt="Logo" className="w-36 h-auto" />
      </a>  
    <a href="https://drobyonline.com/" 
    style={{ color: '#007Bff', textDecoration: 'underline' }}>
    Drobyonline.com
    </a>
</div>

      {/* Title */}
      <h1 className="text-2xl md:text-2xl font-bold mb-12 text-center ">Business Funding Form</h1>

      {/* Notification Bar */}
      {notification.message && (
        <div
          className={`p-4 mb-4 text-white text-center rounded-lg ${
            notification.type === "warning"
              ? "bg-yellow-400"
              : notification.type === "success"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Business Info */}
      <div className="space-y-4 px-3 py-2 border border-gray-300 rounded-lg">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name of Business <span className="text-red-500">*</span></label>
          <div className="mt-1">
            {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName}</p>}
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Business Tax ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Tax ID <span className="text-red-500">*</span></label>
          <div className="mt-1">
            {errors.taxId && <p className="text-red-500 text-sm">{errors.taxId}</p>}
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Fund Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Fund Amount <span className="text-red-500">*</span></label>
          <div className="mt-1">
            {errors.fundAmount && <p className="text-red-500 text-sm">{errors.fundAmount}</p>}
            <input
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Use of Fund */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Use of Fund</label>
          <div className="mt-1">
            <textarea
              value={useOfFund}
              onChange={(e) => setUseOfFund(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Best Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Best Contact Number <span className="text-red-500">*</span></label>
          <div className="mt-1">
            {errors.bestContactNumber && <p className="text-red-500 text-sm">{errors.bestContactNumber}</p>}
            <input
              type="text"
              value={bestContactNumber}
              onChange={(e) => setBestContactNumber(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Business Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Start Date <span className="text-red-500">*</span></label>
          <div className="mt-1">
            {errors.businessStartDate && <p className="text-red-500 text-sm">{errors.businessStartDate}</p>}
            <input
              type="date"
              value={businessStartDate}
              onChange={(e) => setBusinessStartDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Owners Info */}
      <div className="space-y-6 mt-8">
        {owners.map((owner, index) => (
          <div key={index} className="p-6 border border-gray-300 rounded-lg bg-gray-50">
            {index > 0 && <h3 className="text-xl font-semibold text-gray-700 mb-4">Owner {index + 1} Details</h3>}
            <div className="space-y-4">
              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {errors[`ownerName${index}`] && <p className="text-red-500 text-sm">{errors[`ownerName${index}`]}</p>}
                  <input
                    type="text"
                    name="name"
                    value={owner.name}
                    onChange={(e) => handleOwnerChange(index, e)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Owner SSN */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner SSN <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {errors[`ownerSsn${index}`] && <p className="text-red-500 text-sm">{errors[`ownerSsn${index}`]}</p>}
                  <input
                    type="text"
                    name="ssn"
                    value={owner.ssn}
                    onChange={(e) => handleOwnerChange(index, e)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Owner Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Phone Number <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {errors[`ownerPhone${index}`] && <p className="text-red-500 text-sm">{errors[`ownerPhone${index}`]}</p>}
                  <input
                    type="text"
                    name="phone"
                    value={owner.phone}
                    onChange={(e) => handleOwnerChange(index, e)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Owner Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Email <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {errors[`ownerEmail${index}`] && <p className="text-red-500 text-sm">{errors[`ownerEmail${index}`]}</p>}
                  <input
                    type="email"
                    name="email"
                    value={owner.email}
                    onChange={(e) => handleOwnerChange(index, e)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Ownership Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Ownership Percentage <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {errors[`ownerPercentage${index}`] && <p className="text-red-500 text-sm">{errors[`ownerPercentage${index}`]}</p>}
                  <input
                    type="number"
                    name="percentage"
                    value={owner.percentage}
                    onChange={(e) => handlePercentageChange(index, e)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Owner Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Address <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {errors[`ownerAddress${index}`] && <p className="text-red-500 text-sm">{errors[`ownerAddress${index}`]}</p>}
                  <input
                    type="text"
                    name="address"
                    value={owner.address}
                    onChange={(e) => handleOwnerChange(index, e)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Owner Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Date of Birth <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {errors[`ownerDateOfBirth${index}`] && <p className="text-red-500 text-sm">{errors[`ownerDateOfBirth${index}`]}</p>}
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={owner.dateOfBirth}
                    onChange={(e) => handleOwnerChange(index, e)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Signature</label>
                <div className="mt-1 border border-gray-300 rounded-md p-4">
                  <SignatureCanvas
                    ref={(ref) => (sigCanvasRefs.current[index] = ref)}
                    canvasProps={{ width: 400, height: 100, className: "react-signature-canvas" }}
                    onEnd={() => handleSignatureChange(index)}
                  />
                  <button
                    type="button"
                    onClick={() => handleClearSignature(index)}
                    className="mt-2 px-4 py-2 bg-gray-300 text-red-600 rounded-md hover:bg-gray-400"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* File Attachment */}
      <div className="mb-4 mt-8">
        <label className="block text-sm font-medium text-gray-700">Enter Last 3 Months of Your Business Banking Statements</label>
        <div {...getRootProps()} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <input {...getInputProps()} />
          <p className="text-sm text-gray-600">
            Drag & drop a file here, or click to select one (JPEG, PNG, PDF)
          </p>
        </div>
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between mt-2 p-2 bg-gray-100 rounded-lg">
            <span className="text-sm text-gray-700">{file.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveFile(index)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Consent Checkbox */}
      <div className="mb-4 mt-8">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            By clicking here you authorized the parent company of Drobyonline.com - 275a Owner LLC to use the gathered information for the purpose of receiving working capital for the business explicitly named on this application matching the bank statements. Only 275a Owner ISO partners will receive any related information for this applicant with the explicit consent of the applicant to perform a background check or credit check of the owner and the company to receive funding for the business.
          </label>
        </div>
        {errors.consentChecked && <p className="text-red-500 text-sm">{errors.consentChecked}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer w-full md:w-1/2 flex flex-row justify-center items-center mx-auto mb-16 mt-10 px-4 py-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};

export default Form;
