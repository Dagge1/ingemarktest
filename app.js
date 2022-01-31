#!/usr/bin/env node
require('dotenv').config({path: __dirname + '/.env'});  // we use local env variable
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const fs = require('fs');
const path = require("path");
const axios = require('axios');
const emailRegexSafe = require('email-regex-safe');  // extract emails
const sha256 = require('crypto-js/sha256');  // sha256 email enc


var matches = '';
var scriptArg;  // CLI entered script argument that contains path to the file & file name, or undefined
var mystring = ''; // retrieved text
var foundUrl = null; // found url based on the filter criteria
scriptArg = argv._[0] || !!null; // CLI arg, location of the text file, if no arg entered coerce to true/false

if (scriptArg) {  // If the user entered file path as an argument in the CLI
  mystring = fs.readFileSync(path.resolve(__dirname, scriptArg), 'utf8');  // ..read desired text file synchronous way and convert binary to a string
}

//console.log('Read file: ', mystring);
//console.log(scriptArg);

/** Extract string inside brackets [] */
matches = mystring.match(/\[(.*)\]/);  // find string inside outer brackets [] 
var insideBrackets = [];  // array with extracted and cleaned items inside outer bracket

if (matches) {
    var submatch = matches[1];  // if found extract everything inside outer brackets
    var insideTemp = [];
    let tempString = ''
    insideTemp.push(submatch.split(' '));  // first push raw entries
    for (let i of insideTemp) {
        tempString += i.toString().replace(/\[|\]/g, '');  // convert to string and get rid of []
    }
    //console.log('TempString inside brackets: ', tempString);  // temp string inside outer bracket cleaned from [] 
    insideBrackets = tempString.split(',');  // split filtered string into array by ,
    //console.log('Extracted:', insideBrackets);  // arr items inside outer brackets cleaned from [ and ]
}

/** Check if string is an url */
var finalArr = [];  // find only web addresses inside insideBrackets items

for (let address of insideBrackets) {

    //var address = 'www.proba.eu'; // address
    var prefix = ['http://www.', 'https://www.', 'www.'];  // possible web address prefixes
    var suffix = ['.com', '.co', '.net', '.org', '.info', '.biz', '.co.uk', '.eu', '.de', '.hr']; // possible web domains, add more at your convenience

    var resultPrefix = prefix.filter(item => { // find if there is known prefix for given web address
        return address.startsWith(item);
    })
    var resultSuffix = suffix.filter(item => { // find known web address suffix
        return address.endsWith(item);
    })

    if (resultPrefix.length && resultSuffix.length) {
        finalArr.push(address);  // if item is valid web address push it to the final array
    }
    //console.log('www: ', resultPrefix.length);  // give 1 if there is prefix, otherwise give 0
    //console.log('.com: ', resultSuffix.length);  // ditto for suffix - if both are 1 web address is valid
}
//console.log('FINAL ARR WITH DETECTED URLs', finalArr);  // final array with filtered addresses inside brackets

var finalArrLength = finalArr.length;
if ( finalArr && finalArr.length > 0) {
  foundUrl = finalArr[finalArrLength-1];  // location of final url
}
//console.log('SELECTED URL: ', foundUrl);

/** Detect presence of http:// or https:// protocol in the found web address */
var protocolFound = '';
if (foundUrl && foundUrl.substring(0, 8) === 'https://') {
  protocolFound = 'https://';
} else if (foundUrl && foundUrl.substring(0, 7) === 'http://') {
  protocolFound = 'http://';
}

/** Construct valid url based on the final url string */
if (!protocolFound) { 
  foundUrl = 'https://' + foundUrl;  // if web string is without protocol like www.something.com, add https:// protocol for use in axios
}

/** Fetch data from detected/fetched URL */
var title = [];  // html page title
var emails = []; // extracted emails
var emailEnc = null;  // encrypted email
var secretKey = process.env['IM_SECRET'] || ''; // secret key taken from the local .env
var result = {}; // end result to be displayed

if (scriptArg) {  // if user entered arg in the CLI
  axios.get(foundUrl).then(result => {
      title = result.data.match(/<title>(.*?)<\/title>/g).map(item => {  // extract title tag
          return item.replace(/<\/?title>/g,'');  // and strip tags
      });
      
      emails = result.data.match(emailRegexSafe()) || [];  // find emails in a html body doc
      //console.log('TITLE: ', title[0]);
      //console.log('EMAILS: ', emails[0]);
      
      /** If found email encrypt it with SHA256 and a secret key located in the local .env variable */
      if (!!emails && emails.length) {
          emailEnc = sha256(emails[0], secretKey);
          //console.log('SHA256 email: ' + emailEnc);  // encrypted email with secret key
      }
      
      /** Conditionally add items into final display object, based on availability */
      result = {...(foundUrl && {url: foundUrl}), ...(title[0] && {title: title[0]}), ...(emailEnc && {email: emailEnc.toString()})}
      console.log(result);  // display final object
  }).catch(_ => {
    console.log(`FAILED URL REQUEST ATTEPMT (Err: ${_.errno}, ${_.code}), next try in one minute...`);
    setTimeout(_ => {  // try again in one minute

      axios.get().then(result => {
        title = result.data.match(/<title>(.*?)<\/title>/g).map(item => {  // extract title tag
          return item.replace(/<\/?title>/g,'');  // and strip tags
        });
      
        emails = result.data.match(emailRegexSafe()) || [];  // find emails in a html body doc

        if (!!emails && emails.length) {
            emailEnc = sha256(emails[0], secretKey);
        }
        
        /** Second attempt - conditionally add items into final display object */
        result = {...(foundUrl && {url: foundUrl}), ...(title[0] && {title: title[0]}), ...(emailEnc && {email: emailEnc.toString()})}  
        console.log(result);  // display final object
      }).catch(e => console.log('Error: ', e));

    }, 60*1000);  // one minute time delay
  });
}  // end of if
