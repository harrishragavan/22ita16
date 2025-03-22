require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const TEST_SERVER_URL = "http://20.244.56.144/test"; 
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const cache = {};
const CACHE_EXPIRY = 300000; 

app.use(cors());
app.use(express.json());

const getCachedData = (key) => {
    if (cache[key] && (Date.now() - cache[key].timestamp < CACHE_EXPIRY)) {
        return cache[key].data;
    }
    return null;
};

const setCacheData = (key, data) => {
    cache[key] = { data, timestamp: Date.now() };
};

const fetchAuthToken = async () => {
    try {
        if (getCachedData("auth_token")) {
            return getCachedData("auth_token"); 
        }

        console.log(" Requesting authentication token...");
        const response = await axios.post(`${TEST_SERVER_URL}/auth`, {
            companyName: "Affordmed", 
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            ownerName: "Harrishragavan",
            ownerEmail: "harrishragavan1552005@gmail.com",
            rollNo: "22ita16"
        });

        console.log(" Auth Response:", response.data);

        if (response.data.access_token) {
            const token = response.data.access_token;
            setCacheData("auth_token", token); 
            console.log(" Token Stored:", token);
            return token;
        } else {
            throw new Error("Authentication failed: No access_token received");
        }
    } catch (error) {
        console.error("Auth Error:", error.response?.data || error.message);
        throw new Error("Authentication failed");
    }
};


const fetchFromTestServer = async (endpoint) => {
    try {
        const token = await fetchAuthToken();
        if (!token) throw new Error("Authentication failed. No token available.");

        console.log(` Fetching data from ${TEST_SERVER_URL}${endpoint}`);

        const response = await axios.get(`${TEST_SERVER_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log(` API Response (${endpoint}):`, response.data);
        return response.data;
    } catch (error) {
        console.error(` API Error (${endpoint}):`, error.response?.data || error.message);
        throw new Error(`Failed to fetch ${endpoint}`);
    }
};

app.get("/users", async (req, res) => {
    try {
        const cacheKey = "top_users";
        const cachedData = getCachedData(cacheKey);
        if (cachedData) return res.json(cachedData);

        const data = await fetchFromTestServer("/users");
        if (!data.users) return res.status(500).json({ error: "Invalid response from API" });

        const usersArray = Object.entries(data.users).map(([id, name]) => ({
            id,
            name,
            postCount: Math.floor(Math.random() * 100),
        }));

        const topUsers = usersArray.sort((a, b) => b.postCount - a.postCount).slice(0, 5);
        setCacheData(cacheKey, topUsers); 

        res.json(topUsers);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get("/users/:userId/posts", async (req, res) => {
    try {
        const { userId } = req.params;
        const cacheKey = `user_${userId}_posts`;
        const cachedData = getCachedData(cacheKey);
        if (cachedData) return res.json(cachedData);

        const data = await fetchFromTestServer(`/users/${userId}/posts`);
        if (!data.posts) return res.status(500).json({ error: "Invalid response from API" });

        setCacheData(cacheKey, data.posts); 
        res.json(data.posts);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
