<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Problem
> **The World is becoming more Global** 
> This means more travel between countries and increasing frequencies & ease. This also means that it is easier for diseases and outbreaks to spread. Though the viruses have gotten advanced with the ages, our methods of tracking & handling cases are still done on excel spreadsheets & I am to fix that. I'm building an Outbreak Management Software that aims to not only help Outbreak Case workers streamline their investigations but also innovate Outbreak Case Management as a whole :D. My long-term goal with this project is to expand it to other areas of disease & public health management such as site inspections 

*Deadline*: May 25th, 2026

# Feature List
1. Outbreak predictions
    - Map view of area with calendar input to look at past outbreaks & the predicted future outbreaks
    - List view with calendar 
2. Outbreak management 
    - Input new outbreaks
        - Create contacts & cases associated with the outbreak
        - Assign contacts to case workers
    - Allow hospitals or long term care homes to report suspected outbreaks 
        - Different view for non-case workers vs case workers
    - Create seamless communication between units (hospitals, long term care homes, municiplities, etc) & case/outbreak workers
    - Training Integration - Leverage AI solutions to train new employees on how to handle case contacts via simulated calls
        - Record and grade case calls(?) 
    - Manager vs employee views of outbreak management
        - Employee see cases, contacts associated with those cases, TODOs & any notes associated with the case
        - Managers see what employees see with the additional fuctionality of adding employees to outbreaks/cases 
3. Outbreak Statistics
    - Dashboard view of open cases, closed cases, types of viruses/bacteria/etc. 
    - Manager View: Cases handled by employees, other relevant "grading" notes for employees

## Tech Stack
**Front-End** - Node JS
**Back-End** 
- AWS databases for storage of dummy information 
- 