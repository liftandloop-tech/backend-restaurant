export const sendResponse = (res, status, message, data = null) => {
   const response = {
    success: status >= 200 && status < 300,
    message,
    ...(data !== null && { data })
  };
  
  res.status(status).json(response);
};

export const sendSuccess = (res, message, data = null, status = 200) => {
  sendResponse(res, status, message, data);
};

 export const sendError = (res, message, status = 400, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };
  
  res.status(status).json(response);
};

// const response = {
//   success: sendSuccess,
//   error: sendError,
//   send: sendResponse
// };
const response = {
  success: sendSuccess,
  error: sendError,
  send: sendResponse
}

export default response;

