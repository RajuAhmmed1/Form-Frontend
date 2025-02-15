import { useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";

const Form = () => {
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [useOfFund, setUseOfFund] = useState("");
  const [owners, setOwners] = useState([
    { name: "", ssn: "", phone: "", email: "", percentage: "", address: "", signature: "" },
  ]);
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const sigCanvasRefs = useRef([]);

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    // Validate file types and size
    for (let file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Limit file size to 5MB
        alert("File size should not exceed 5MB.");
        return;
      }
    }
    setFiles([...selectedFiles]);
  };
  

  const handleOwnerChange = (index, event) => {
    const values = [...owners];
    values[index][event.target.name] = event.target.value;
    setOwners(values);
  };

  const handlePercentageChange = (index, event) => {
    const value = parseFloat(event.target.value);
    if (isNaN(value) || value < 0) return; // Prevent negative or non-numeric input
    const updatedOwners = [...owners];
    updatedOwners[index].percentage = value;
  
    const totalPercentage = updatedOwners.reduce(
      (sum, owner) => sum + parseFloat(owner.percentage || 0),
      0
    );
    
    if (totalPercentage >= 51) {
      setOwners(updatedOwners.slice(0, index + 1));  // Slice to enforce max 51%
    } else {
      if (index === owners.length - 1) {
        setOwners([ ...updatedOwners, { name: "", ssn: "", phone: "", email: "", percentage: "", address: "", signature: "" }]);
      } else {
        setOwners(updatedOwners);
      }
    }
  };
  
  

  const handleClearSignature = (index) => {
    sigCanvasRefs.current[index].clear();
    const updatedOwners = [...owners];
    updatedOwners[index].signature = "";
    setOwners(updatedOwners);
  };


  const handleSignatureChange = (index) => {
    const signature = sigCanvasRefs.current[index].toDataURL();
    const updatedOwners = [...owners];
    updatedOwners[index].signature = signature;
    setOwners(updatedOwners);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate total ownership percentage
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

    const formData = new FormData();
    formData.append("businessName", businessName);
    formData.append("taxId", taxId);
    formData.append("fundAmount", fundAmount);
    formData.append("useOfFund", useOfFund);

    // Append owner details to formData
    owners.forEach((owner, index) => {
      formData.append(`owner${index + 1}_name`, owner.name);
      formData.append(`owner${index + 1}_ssn`, owner.ssn);
      formData.append(`owner${index + 1}_phone`, owner.phone);
      formData.append(`owner${index + 1}_email`, owner.email);
      formData.append(`owner${index + 1}_percentage`, owner.percentage);
      formData.append(`owner${index + 1}_address`, owner.address);
      if (owner.signature) {
        formData.append(`owner${index + 1}_signature`, owner.signature);
      }
    });

    // Append files to formData
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.post(
        "/api/form",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setNotification({
        message: "Form submitted successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      setNotification({
        message: "There was an error submitting the form.",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-3xl p-6 bg-white shadow-lg rounded-lg">
        {/* Notification Bar */}
        {notification.message && (
          <div
            className={`p-4 mb-4 text-white text-center rounded-lg ${
              notification.type === "warning"
                ? "bg-yellow-500"
                : notification.type === "success"
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {notification.message}
          </div>
        )}

        <h2 className="text-3xl font-semibold text-center text-gray-700 mb-8">
          Business and Ownership Details
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Business Info */}
          <div className="space-y-6">
            <div className="flex flex-col">
              <label className="font-semibold text-gray-600">Name of Business:</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-600">Business Tax ID:</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                required
                className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-600">Fund Amount:</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                required
                className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-600">Use of Fund:</label>
              <textarea
                value={useOfFund}
                onChange={(e) => setUseOfFund(e.target.value)}
                required
                className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Owners Info */}
          <div className="space-y-6 mt-8">
            {owners.map((owner, index) => (
              <div key={index} className="p-6 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Owner {index + 1} Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="font-semibold text-gray-600">Owner Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={owner.name}
                      onChange={(e) => handleOwnerChange(index, e)}
                      required
                      className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-semibold text-gray-600">Owner SSN:</label>
                    <input
                      type="text"
                      name="ssn"
                      value={owner.ssn}
                      onChange={(e) => handleOwnerChange(index, e)}
                      required
                      className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-semibold text-gray-600">Owner Phone Number:</label>
                    <input
                      type="text"
                      name="phone"
                      value={owner.phone}
                      onChange={(e) => handleOwnerChange(index, e)}
                      required
                      className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-semibold text-gray-600">Owner Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={owner.email}
                      onChange={(e) => handleOwnerChange(index, e)}
                      required
                      className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-semibold text-gray-600">Ownership Percentage:</label>
                    <input
                      type="number"
                      name="percentage"
                      value={owner.percentage}
                      onChange={(e) => handlePercentageChange(index, e)}
                      required
                      className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-semibold text-gray-600">Owner Address:</label>
                    <input
                      type="text"
                      name="address"
                      value={owner.address}
                      onChange={(e) => handleOwnerChange(index, e)}
                      required
                      className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-semibold text-gray-600">Signature:</label>
                    <SignatureCanvas
                      ref={(ref) => (sigCanvasRefs.current[index] = ref)}
                      canvasProps={{
                        width: 300,
                        height: 100,
                        className: "border border-gray-300",
                      }}
                      onEnd={() => handleSignatureChange(index)}
                    />
                    <div className="flex justify-between mt-2">
                      <button
                        type="button"
                        onClick={() => handleClearSignature(index)}
                        className="text-red-600"
                      >
                        Clear
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => handleSaveSignature(index)}
                        className="text-green-600"
                      >
                        Save
                      </button> */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* File Upload */}
          <div className="flex flex-col mt-8">
            <label className="font-semibold text-gray-600">Upload Files:</label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              className="border border-gray-300 p-3 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              type="submit"
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;
