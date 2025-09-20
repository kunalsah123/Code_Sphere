const axios = require('axios');


const getlanguageById = (lang) => {
    const language = {
        "c++": 54,
        "java": 62,
        "javascript": 63,
    }

    return language[lang.toLowerCase()];
}


const submitBatch = async (submissions) => {


    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            base64_encoded: 'false'
        },
        headers: {
            'x-rapidapi-key': '4e54b5a566msheb626ea8067098dp13706ejsn5fb90cfc8c38',
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            submissions
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    return await fetchData();
}

// Function to wait for a specified time
// This is used to wait for the Judge0 API to process the submissions before fetching the results
const Waiting = async (timer)=>{
    setTimeout(()=>{
        return 1;
    },timer);
}
const submitToken = async (resultToken) => {

    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultToken.join(','),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': '4e54b5a566msheb626ea8067098dp13706ejsn5fb90cfc8c38',
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    while (true) {
        const result = await fetchData();

        const isResultObtained = await result.submissions.every((r) => r.status_id > 2);

        if (isResultObtained) return result.submissions;

        await Waiting(1000);
    }

}

module.exports = { getlanguageById, submitBatch, submitToken };
