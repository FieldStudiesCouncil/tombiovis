## Preview the new FSC Identikit

We are aiming to release a new version of the Identikit during April or May 2019 (version 1.9). We have three objectives for the new release:

>1. To make it easier for knowlege-base creators to install and use.
>2. To fix some bugs.
>3. To add some new features.

Most of the work to make Identikit easier to install and use is complete, the bugs are fixed and some of the new features
are implemented.

We are keen to make the new environment for knowledge-base developers available as soon as possible. To that end we've created a pre-release of version 1.9. To get up and running with the new version, follow these steps:

>1. Install <https://nodejs.org> on your computer.
>2. Download the [new source code (zip).](https://github.com/FieldStudiesCouncil/tombiovis/archive/v1.9-alpha.2.zip)
>3. Unzip the downloaded zip file ```tombiovis-1.9-alpha.2.zip``` to any convenient location on your computer.
>4. Using your usual file explorer tools, open the folder ```tombiovis-1.9-alpha.2\tombiovis-1.9-alpha.2```.
>5. Open a Windows 'command window' by double-clicking the ```start.bat``` file (non-Windows users see note below).
>6. In the command window, type ```npm install``` and hit enter.
>7. In the command window, type ```npm start``` and hit enter.

Non-Windows users will probably not be able to run the  ```start.bat``` file in step 5. Instead open whatever the equivalent command or terminal window is on your operating system and then continue from step 6.

Step 6 is a one-off step to configure NodeJS for the Identikit. Subsequently, all you have to do to start the Identikit is repeat steps 5 and 7. You must leave the 'command window' open whilst Identikit runs, but you can minimise it if you like.

>If you have an existing a knowledge-base, just move or copy the entire folder into the ```tombiovis-1.9-alpha.2\tombiovis-1.9-alpha.2\identikit\kb``` folder. 

That's all - no need to edit any HTML files. Links to use your knowledge-base - both with standard and mobile interfaces - will appear when you start Identikit. 

>If you are starting from scratch, just copy and rename the entire ```biscuits``` knowledge-base folder in the aforementioned ```kb``` folder and start modifying the Excel spreadsheet within.

For help on buidling a knowledge-base open the help document from the Identikit menu bar: ```Identikit Help > Building a Knowlege-base```. Although the documentation has not yet been updated for release 1.9, this document will still be mostly accurate. (Note however, that the documents 'getting started' and 'quick start guide' are out of date - they are superseded by information on this page.)

If you have a question for which you can't find an answer in the documentation, please feel free to [email Rich Burkmar](mailto:rburkmar@ceh.ac.uk).