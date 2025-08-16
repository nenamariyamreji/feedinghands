// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get the token from the Authorization header
    const authHeader = req.header('Authorization');

    // 2. Check if the token exists
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // 3. The token is expected in the format "Bearer [token]". We split it to get just the token part.
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Malformed token.' });
        }

        // 4. Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. THE FIX: Attach the 'user' object from the decoded token to the request object.
        // Your other routes (like donations.js) will now be able to access req.user.
        req.user = decoded.user;
        
        next(); // Proceed to the next step (the actual route)
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
