const validator = require('validator');

//data is present in the form of object 
//we will check if all the mandatory fields are present or not
//if not present then we will throw an error
//if present then we will return true



const validate = (data)=>{
    const mandatoryFields = ['firstName', 'emailId', 'password'];
    const IsAllowed = mandatoryFields.every((k)=> Object.keys(data).includes(k));

    if(!IsAllowed){
        throw new Error('Mandatory fields are missing');
    }

    //using validator to check if the email is valid
    //if not valid then we will throw an error
    if(!validator.isEmail(data.emailId)){
        throw new Error('Invalid email format');
    }


    if(!validator.isStrongPassword(data.password)){
        throw new Error('Password is not strong enough');
    }

    
}

module.exports = validate;
