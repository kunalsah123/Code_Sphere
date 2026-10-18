const axios = require('axios');

const judge0Url = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const judge0Host = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

const getHeaders = () => {
    if (!process.env.JUDGE0_API_KEY) {
        throw new Error('JUDGE0_API_KEY is missing. Configure it in Backend/.env.');
    }
    return {
        'x-rapidapi-key': process.env.JUDGE0_API_KEY,
        'x-rapidapi-host': judge0Host,
        'Content-Type': 'application/json'
    };
};

const getlanguageById = (lang) => ({
    'c++': 54,
    java: 62,
    javascript: 63
})[lang?.toLowerCase()];

const encodeSubmissionText = (submission) => {
    const encoded = { ...submission };
    for (const field of ['source_code', 'stdin', 'expected_output']) {
        if (typeof encoded[field] === 'string') {
            encoded[field] = Buffer.from(encoded[field], 'utf8').toString('base64');
        }
    }
    return encoded;
};

const decodeSubmissionText = (submission) => {
    const decoded = { ...submission };
    for (const field of ['stdin', 'expected_output', 'stdout', 'stderr', 'compile_output', 'message']) {
        if (typeof decoded[field] === 'string' && decoded[field].length > 0) {
            decoded[field] = Buffer.from(decoded[field], 'base64').toString('utf8');
        }
    }
    return decoded;
};

const submitBatch = async (submissions) => {
    if (!Array.isArray(submissions) || submissions.length === 0) {
        throw new Error('At least one submission is required.');
    }
    const response = await axios.post(`${judge0Url}/submissions/batch`, {
        submissions: submissions.map(encodeSubmissionText)
    }, {
        params: { base64_encoded: 'true' },
        headers: getHeaders(),
        timeout: 15000
    });
    return response.data;
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const submitToken = async (tokens) => {
    if (!Array.isArray(tokens) || tokens.length === 0) {
        throw new Error('Judge0 returned no submission tokens.');
    }

    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
        const response = await axios.get(`${judge0Url}/submissions/batch`, {
            params: {
                tokens: tokens.join(','),
                base64_encoded: 'true',
                fields: 'token,stdin,expected_output,stdout,stderr,status_id,time,memory,compile_output,message,language_id'
            },
            headers: getHeaders(),
            timeout: 15000
        });
        const results = response.data?.submissions?.map(decodeSubmissionText);
        if (!Array.isArray(results) || results.length !== tokens.length) {
            throw new Error('Judge0 returned an invalid batch result.');
        }
        if (results.every((result) => result.status_id > 2)) return results;
        await wait(1000);
    }
    throw new Error('Judge0 execution timed out. Please try again.');
};

module.exports = { getlanguageById, submitBatch, submitToken };
