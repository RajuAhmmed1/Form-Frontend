import { useEffect, useState } from "react";
import PropTypes from "prop-types";

const ThankYouModal = ({ isOpen, onClose, message, buttonText, redirectUrl, delay }) => {
  const [countdown, setCountdown] = useState(delay);

  useEffect(() => {
    if (isOpen) {
      // Start the countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // Set a timer to redirect after the specified delay
      const redirectTimer = setTimeout(() => {
        window.location.href = redirectUrl; // Redirect to the specified URL
      }, delay * 1000); // Convert seconds to milliseconds

      // Cleanup the timers if the component unmounts
      return () => {
        clearInterval(countdownInterval);
        clearTimeout(redirectTimer);
      };
    }
  }, [isOpen, redirectUrl, delay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Thank You!</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <p className="text-gray-500 mb-4">Redirecting in {countdown} seconds...</p>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

ThankYouModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  buttonText: PropTypes.string,
  redirectUrl: PropTypes.string.isRequired,
  delay: PropTypes.number.isRequired,
};

ThankYouModal.defaultProps = {
  buttonText: "Close",
};

export default ThankYouModal;