# Financial Data Pipeline

## About
Here is a static version of the script I used to automate a financial data pipeline using JavaScript within Google Sheets for LaunchCode. The main problem was that automating finacial data was very manual and time-consuming, as profit and loss data was constantly being updated even after the end of a company deal (labeled by course ID).

## Function
The main functionality is separate into two parts: pre-upload and post-upload. A UI menu was created to make the process more simple.

Pre-Upload: The first portion of the pipeline, where space is cleared before uploading new data and appropriate course IDs are transferred

Post-Upload: The second portion of the pipeline, where all courses are updated, then sorted into ongoing and closed tabs (for ease of use later).

*See the script itself for more specific code documentation*
