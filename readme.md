### Ingemark - Nodejs & CLI challenge

#### DESCRIPTION
Nodejs CLI script for extracting web addresses from a file, fetch only valid urls inside brackets based on criteria and extract one Url based on criteria. Then fetch selected domain and if valid extract Title and first Email from the HTML document. If found email, encrypt with SHA256 using secret key from the local .env
Finally display url, title, email in the form of the object (omit key/value pairs that are not available).

#### HOW TO LAUNCH
- install node modules: npm i
- launch app: node app ./input.txt (where input.txt is a third argment in CLI, file location for parsing required data)
- other parameters & conditional behavior are located in the instructions pdf document (not present in this folder)

#### CLARIFICATIONS
console log info messages were commented out and left for testing data flow in the program. You are free to delete them if not needed.
Default data to be parsed is located in the input.txt file, both can be changed file name and file location relative to this script

#### ADDITIONAL INFO
If you want to use your own name for the script and make it available globally, enter this command into CLI: npm link (or npm link ingemark)
Now you can use command like this: ingemark ./input.txt  (take care to enter correct relative path to the location of your desired .txt file
Before entering: npm link command you can change script name in package.json under bin {} section   
  
Voila!  
DC