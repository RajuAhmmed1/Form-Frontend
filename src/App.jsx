import { useState, useRef, useEffect } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import { useDropzone } from "react-dropzone";
import logo from "./assets/logo.jpg";

const emptyOwner = {
  name: "",
  ssn: "",
  phone: "",
  email: "",
  percentage: "",
  address: "",
  signature: "",
  dateOfBirth: "",
};

const Form = () => {
  const [hearFromUs, setHearFromUs] = useState("");
  const [userIp, setUserIp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [useOfFund, setUseOfFund] = useState("");
  const [bestContactNumber, setBestContactNumber] = useState("");
  const [businessStartDate, setBusinessStartDate] = useState("");
  const [owners, setOwners] = useState([{ ...emptyOwner }]);
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [consentChecked, setConsentChecked] = useState(false);

  const sigCanvasRefs = useRef([]);

  const hasAnyOwnerData = (owner) => {
    return Object.entries(owner).some(([key, value]) => {
      if (key === "signature") return false;
      return String(value || "").trim() !== "";
    });
  };

  const getActiveOwners = () => {
    return owners.filter(hasAnyOwnerData);
  };

  const normalizeOwnersForUI = (ownerList) => {
    const cleaned = ownerList.filter(hasAnyOwnerData);

    const total = cleaned.reduce(
      (sum, owner) => sum + parseFloat(owner.percentage || 0),
      0
    );

    if (total < 51) {
      return [...cleaned, { ...emptyOwner }];
    }

    return cleaned.length > 0 ? cleaned : [{ ...emptyOwner }];
  };

  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFiles((prev) => [...prev, ...acceptedFiles]);
      }
    },
  });

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await axios.get("https://api.ipify.org?format=json");
        setUserIp(response.data.ip || "");
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

  useEffect(() => {
    if (isSubmitting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isSubmitting]);

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setNotification({
      message: "File removed successfully.",
      type: "success",
    });
  };

  const handleOwnerChange = (index, event) => {
    const { name, value } = event.target;

    setOwners((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [name]: value,
      };
      return normalizeOwnersForUI(updated);
    });
  };

  const handlePercentageChange = (index, event) => {
    const value = event.target.value;

    setOwners((prev) => {
      const updated = [...prev];

      if (value === "") {
        updated[index] = {
          ...updated[index],
          percentage: "",
        };
        return normalizeOwnersForUI(updated);
      }

      const numericValue = parseFloat(value);

      if (isNaN(numericValue)) {
        return prev;
      }

      updated[index] = {
        ...updated[index],
        percentage: numericValue,
      };

      const filledOwners = updated.filter(hasAnyOwnerData);

      let runningTotal = 0;
      const trimmedOwners = [];

      for (const owner of filledOwners) {
        trimmedOwners.push(owner);
        runningTotal += parseFloat(owner.percentage || 0);
        if (runningTotal >= 51) break;
      }

      return normalizeOwnersForUI(trimmedOwners);
    });
  };

  const handleClearSignature = (index) => {
    const canvas = sigCanvasRefs.current[index];
    if (canvas) {
      canvas.clear();
    }

    setOwners((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          signature: "",
        };
      }
      return updated;
    });
  };

  const handleSignatureChange = (index) => {
    const canvas = sigCanvasRefs.current[index];

    if (!canvas || canvas.isEmpty()) return;

    const signature = canvas.toDataURL();

    setOwners((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          signature,
        };
      }
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!businessName.trim()) {
      newErrors.businessName = "The business name is required.";
    }

    if (!taxId.trim()) {
      newErrors.taxId = "The business tax ID is required.";
    }

    if (!fundAmount) {
      newErrors.fundAmount = "The fund amount is required.";
    }

    if (!bestContactNumber.trim()) {
      newErrors.bestContactNumber = "The best contact number is required.";
    }

    if (!businessStartDate) {
      newErrors.businessStartDate = "The business start date is required.";
    }

    if (!hearFromUs.trim()) {
      newErrors.hearFromUs = "This field is required.";
    }

    if (!consentChecked) {
      newErrors.consentChecked = "You must agree to the terms and conditions.";
    }

    const activeOwners = getActiveOwners();

    if (activeOwners.length === 0) {
      newErrors.ownerName0 = "The owner name is required.";
      newErrors.ownerSsn0 = "The owner SSN is required.";
      newErrors.ownerPhone0 = "The owner phone number is required.";
      newErrors.ownerEmail0 = "The email is required.";
      newErrors.ownerPercentage0 = "The ownership percentage is required.";
      newErrors.ownerAddress0 = "The owner address is required.";
      newErrors.ownerDateOfBirth0 = "The owner date of birth is required.";
    } else {
      activeOwners.forEach((owner, index) => {
        if (!owner.name.trim()) {
          newErrors[`ownerName${index}`] = "The owner name is required.";
        }

        if (!owner.ssn.trim()) {
          newErrors[`ownerSsn${index}`] = "The owner SSN is required.";
        }

        if (!owner.phone.trim()) {
          newErrors[`ownerPhone${index}`] = "The owner phone number is required.";
        }

        if (!owner.email.trim()) {
          newErrors[`ownerEmail${index}`] = "The email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) {
          newErrors[`ownerEmail${index}`] = "The email format is invalid.";
        }

        if (
          owner.percentage === "" ||
          owner.percentage === null ||
          owner.percentage === undefined
        ) {
          newErrors[`ownerPercentage${index}`] =
            "The ownership percentage is required.";
        }

        if (!owner.address.trim()) {
          newErrors[`ownerAddress${index}`] = "The owner address is required.";
        }

        if (!owner.dateOfBirth) {
          newErrors[`ownerDateOfBirth${index}`] =
            "The owner date of birth is required.";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setHearFromUs("");
    setBusinessName("");
    setTaxId("");
    setFundAmount("");
    setUseOfFund("");
    setBestContactNumber("");
    setBusinessStartDate("");
    setOwners([{ ...emptyOwner }]);
    setFiles([]);
    setErrors({});
    setConsentChecked(false);

    sigCanvasRefs.current.forEach((canvas) => {
      if (canvas) canvas.clear();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setNotification({ message: "", type: "" });

    if (!validateForm()) {
      setNotification({
        message: "Please fix the errors in the form.",
        type: "warning",
      });
      return;
    }

    const activeOwners = getActiveOwners();

    const totalPercentage = activeOwners.reduce(
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

    try {
      const formData = new FormData();
      formData.append("businessName", businessName);
      formData.append("taxId", taxId);
      formData.append("fundAmount", fundAmount);
      formData.append("useOfFund", useOfFund);
      formData.append("bestContactNumber", bestContactNumber);
      formData.append("businessStartDate", businessStartDate);
      formData.append("owners", JSON.stringify(activeOwners));
      formData.append("consentChecked", String(consentChecked));
      formData.append("userIp", userIp);
      formData.append("hearFromUs", hearFromUs);

      files.forEach((file) => {
        formData.append("files", file);
      });

      await axios.post("https://dynamicform-1.onrender.com/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setNotification({
        message: "Form submitted successfully! Your rep will contact you shortly.",
        type: "success",
      });

      resetForm();

      setTimeout(() => {
        window.location.href = "https://drobyonline.com/";
      }, 4000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setNotification({
        message: "There was an error submitting the form.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <h2 className="mt-5 text-xl font-semibold text-gray-800">
              Submitting Form
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we securely process your information.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-6 bg-white shadow-md rounded-lg mt-2"
      >
        <div className="flex flex-col items-center mb-6">
          <a href="https://drobyonline.com/" target="_blank" rel="noreferrer">
            <img src={logo} alt="Logo" className="w-36 h-auto" />
          </a>

          <a
            href="https://drobyonline.com/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#007Bff", textDecoration: "underline" }}
          >
            Drobyonline.com
          </a>
        </div>

        <h1 className="text-2xl md:text-2xl font-bold mb-12 text-center">
          Business Funding Form
        </h1>

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

        <div className="space-y-4 px-3 py-4 border border-gray-300 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name of Business <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              {errors.businessName && (
                <p className="text-red-500 text-sm">{errors.businessName}</p>
              )}
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business Tax ID <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              {errors.taxId && (
                <p className="text-red-500 text-sm">{errors.taxId}</p>
              )}
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fund Amount <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              {errors.fundAmount && (
                <p className="text-red-500 text-sm">{errors.fundAmount}</p>
              )}
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Use of Fund
            </label>
            <div className="mt-1">
              <textarea
                value={useOfFund}
                onChange={(e) => setUseOfFund(e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Best Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              {errors.bestContactNumber && (
                <p className="text-red-500 text-sm">
                  {errors.bestContactNumber}
                </p>
              )}
              <input
                type="text"
                value={bestContactNumber}
                onChange={(e) => setBestContactNumber(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business Start Date <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              {errors.businessStartDate && (
                <p className="text-red-500 text-sm">
                  {errors.businessStartDate}
                </p>
              )}
              <input
                type="date"
                value={businessStartDate}
                onChange={(e) => setBusinessStartDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-8">
          {owners.map((owner, index) => (
            <div
              key={index}
              className="p-6 border border-gray-300 rounded-lg bg-gray-50"
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Owner {index + 1} Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {errors[`ownerName${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`ownerName${index}`]}
                      </p>
                    )}
                    <input
                      type="text"
                      name="name"
                      value={owner.name}
                      onChange={(e) => handleOwnerChange(index, e)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner SSN <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {errors[`ownerSsn${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`ownerSsn${index}`]}
                      </p>
                    )}
                    <input
                      type="text"
                      name="ssn"
                      value={owner.ssn}
                      onChange={(e) => handleOwnerChange(index, e)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {errors[`ownerPhone${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`ownerPhone${index}`]}
                      </p>
                    )}
                    <input
                      type="text"
                      name="phone"
                      value={owner.phone}
                      onChange={(e) => handleOwnerChange(index, e)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Email <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {errors[`ownerEmail${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`ownerEmail${index}`]}
                      </p>
                    )}
                    <input
                      type="email"
                      name="email"
                      value={owner.email}
                      onChange={(e) => handleOwnerChange(index, e)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ownership Percentage <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {errors[`ownerPercentage${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`ownerPercentage${index}`]}
                      </p>
                    )}
                    <input
                      type="number"
                      name="percentage"
                      value={owner.percentage}
                      onChange={(e) => handlePercentageChange(index, e)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Address <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {errors[`ownerAddress${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`ownerAddress${index}`]}
                      </p>
                    )}
                    <input
                      type="text"
                      name="address"
                      value={owner.address}
                      onChange={(e) => handleOwnerChange(index, e)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {errors[`ownerDateOfBirth${index}`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`ownerDateOfBirth${index}`]}
                      </p>
                    )}
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={owner.dateOfBirth}
                      onChange={(e) => handleOwnerChange(index, e)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Signature
                  </label>
                  <div className="mt-1 border border-gray-300 rounded-md p-4 bg-white">
                    <div className="w-full overflow-x-auto">
                      <SignatureCanvas
                        ref={(ref) => {
                          sigCanvasRefs.current[index] = ref;
                        }}
                        canvasProps={{
                          width: 400,
                          height: 120,
                          className:
                            "react-signature-canvas border border-gray-200 rounded-md",
                        }}
                        onEnd={() => handleSignatureChange(index)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClearSignature(index)}
                      className="mt-3 px-4 py-2 bg-gray-300 text-red-600 rounded-md hover:bg-gray-400"
                    >
                      Clear Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 mt-8">
          <label className="block text-sm font-medium text-gray-700">
            Enter Last 3 Months of Your Business Banking Statements
          </label>

          <div
            {...getRootProps()}
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500 transition-colors"
          >
            <input {...getInputProps()} />
            <p className="text-sm text-gray-600 text-center">
              Drag &amp; drop a file here, or click to select one (JPEG, PNG,
              PDF)
            </p>
          </div>

          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between mt-2 p-2 bg-gray-100 rounded-lg"
            >
              <span className="text-sm text-gray-700 break-all">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-red-600 hover:text-red-800 ml-4"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mb-4 mt-8">
          <label className="block text-sm font-medium text-gray-700">
            Where did you hear from us? <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            {errors.hearFromUs && (
              <p className="text-red-500 text-sm">{errors.hearFromUs}</p>
            )}
            <input
              type="text"
              value={hearFromUs}
              onChange={(e) => setHearFromUs(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="e.g., Google, Friend, Advertisement, etc."
            />
          </div>
        </div>

        <div className="mb-4 mt-8">
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              By clicking here, you authorize the parent company of
              Drobyonline.com - 275a Owner LLC to use the gathered information
              for the purpose of receiving working capital for the business
              explicitly named on this application matching the bank statements.
              Only 275a Owner ISO partners will receive any related information
              for this applicant with the explicit consent of the applicant to
              perform a background check or credit check of the owner and the
              company to receive funding for the business.
            </label>
          </div>

          {errors.consentChecked && (
            <p className="text-red-500 text-sm mt-2">
              {errors.consentChecked}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer w-full md:w-1/2 flex flex-row justify-center items-center mx-auto mb-16 mt-10 px-4 py-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </>
  );
};

export default Form;
