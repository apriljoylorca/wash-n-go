export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^09\d{9}$/;  // Philippine format: 09 followed by 9 digits
  return phoneRegex.test(phoneNumber.trim());
}; 