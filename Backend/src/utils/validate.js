const validator = require('validator');

//data is present in the form of object 
//we will check if all the mandatory fields are present or not
//if not present then we will throw an error
//if present then we will return true



const validate = (data)=>{
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Please submit valid registration details');
    }
    const mandatoryFields = ['firstName', 'emailId', 'password'];
    const IsAllowed = mandatoryFields.every((k)=> typeof data[k] === 'string' && data[k].trim().length > 0);

    if(!IsAllowed){
        throw new Error('Mandatory fields are missing');
    }

    //using validator to check if the email is valid
    //if not valid then we will throw an error
    const firstName = data.firstName.trim();
    const emailId = data.emailId.trim().toLowerCase();
    if (firstName.length < 3 || firstName.length > 20) {
        throw new Error('Name must be between 3 and 20 characters');
    }
    if(!validator.isEmail(emailId)){
        throw new Error('Invalid email format');
    }


    if(!validator.isStrongPassword(data.password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })){
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol');
    }

    return { firstName, emailId, password: data.password };
}

module.exports = validate;
