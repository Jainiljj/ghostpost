const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  // Normalize Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Normalize Mongoose Cast Errors (e.g. invalid object ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'CAST_ERROR';
    message = `Invalid format for field ${err.path}: ${err.value}`;
  }

  // Normalize MongoDB Duplicate Key Errors
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    message = 'Duplicate database record value detected.';
  }

  // Only log unexpected server errors — not predictable client-side 4xx
  const isServerError = statusCode >= 500;
  if (isServerError) {
    console.error(`[Error] ${statusCode} - ${message}`);
    if (err.stack && process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
  } else if (process.env.NODE_ENV === 'development') {
    // In dev, log 4xx as warnings for debugging
    console.warn(`[Warn] ${statusCode} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV !== 'production' && isServerError && { stack: err.stack })
  });
};

module.exports = errorHandler;
