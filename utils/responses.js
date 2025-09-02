// Standard response helpers
const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ message });
};

const sendServerError = (res, error, message = 'Server error') => {
  console.error('Server error:', error);
  return res.status(500).json({ message });
};

const sendValidationError = (res, missingFields) => {
  const message = `Missing required fields: ${missingFields.join(', ')}`;
  return sendError(res, message, 400);
};

const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404);
};

const sendUnauthorized = (res, message = 'Invalid credentials') => {
  return sendError(res, message, 401);
};

module.exports = {
  sendSuccess,
  sendError,
  sendServerError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized
};