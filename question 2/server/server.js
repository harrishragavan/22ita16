const express = require('express');
const app = express();
app.use(express.json()); 

//Calculate Average API
app.post('/average', (req, res) => {
    const { numbers } = req.body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
        return res.status(400).json({ error: "Invalid input. Provide a non-empty array of numbers." });
    }

    let sum = 0; 
    for (let num of numbers) {
        if (typeof num !== 'number') {
            return res.status(400).json({ error: "Array must contain only numbers." });
        }
        sum += num;
    }

    const average = sum / numbers.length;
    res.json({ average });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
