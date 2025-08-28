exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
};

exports.verifyOTP = (provided, stored, expires) => {
  return provided === stored && Date.now() < expires;
};