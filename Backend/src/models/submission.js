const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//agar mujhe kisi field ke index banana hai to (unique : true) karne se ho jaayiega
//agar data duplicate hain tabhi uske upar indexing ban sakta hain
//harr ek field ko index banana is very bekaar idea hain usse storage badhh jaayiega to waste of storage hoga!
//agar mujhe query fast karna h to perticuar field ke upar indexing bana denge

const submissionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ['javascript', 'python', 'c++', 'java', 'C', 'typescript']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'wrong', 'error'],
        default: 'pending'
    },
    runtime: {
        type: Number, // milliseconds
        default: 0
    },
    memory: {
        type: Number, //KB
        default: 0
    },
    errorMessage: {
        type: String,
        default: ''
    },

    testCasesPassed: {
        type: Number,
        default: 0
    },
    testCasesTotal: { //Recomment Addition
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

//submissionSchema.index({userId:1 , problemId:1}); --> koi code submit kiye uski userId bhi hogi and problemId bhi hogi  
//userId:1 -> yeh keh rha hian ki UserId ko acsending order  mein lagaana hian to pehle userId ascending order mein prblemId bhi lag jaayiega
//-1 ka matlb hota hain descending order ho jaayiega
/*
 * example :-
 * userID    problemId    |   userId  pbmID      actual Ord
 * 4            10        |    4        10   -->  4  9
 * 6            8         |    4        9    -->  4 10 
 * 4            9         |    4        10   -->  4 10
 * 4            10        |    5        7    -->  5 7
 * 5            7         |    6        8    -->  6 8
 * 
 */
//ismien sabse bdaa faayieda yeh hain ki userId already sorted form mein ho jaayeiga to humlog uspe query laga sakte hian!! but problem Id ke upar nahi laga sakte hian kyunki sorted form mein nahi dikhega

submissionSchema.index({userId:1 , problemId:1});


module.exports = mongoose.model('submission', submissionSchema);