# Release notes for existing knoweldge-base developers
These notes are intended to help existing knowledge-base developers move from one version of the FSC Identikit to another. These notes were first released with version 1.7.0 of the Identikit and will be updated on each succeeding release.

## Release 1.9.0
The main feature of this new release is that Identikit is much more resilient to missing data
in knolwedge-bases; so much so that it will now work on a knowledge-base which consists
solely of a taxa.csv file. This makes it easier to start learning how to use. It is also more resilient to differences in case, e.g. BodyColour in taxa worksheet will now match bodycolour
in characters worksheet.

## Release 1.8.2
Release 1.8.2 addresses some minor issues evident when people deploy resources, particularly to CMS and also set the pwaSupress flag to true so that, by default, service worker does not kick in during knowledge-base development (which causes confusing caching issues). No implications for knowledge-base deveopers.

## Release 1.8.1
Minor release to fix a packaging problem. Knowledge-base developers moving to version 1.8.1 from earlier versions should consult the notes below for version 1.8.0.

## Release 1.8.0
The main feature of release 1.8.0 is a new visualisation ('vis6') which is a 'mobile-first' multi-access key that is suitable for using on small-format devices such as smartphones. Using this visualisation and the new Progressive Web App (PWA) features of Identikit 1.8.0, you can build mobile-first multi-access keys which can be deployed as apps on smartphones and even used away from an internet connection.

### Updating to release 1.8.0
The procedure for updating to a new release of the Identikit is the same as demonstrated in this video: http://www.fscbiodiversity.uk/fullscreen/tombiovis-upgrade. (The video was made when version 1.4.1 was released and was still referred to then as *the Framework*.)

### Changes to *vis.html*
Once again, we've made a number of changes to the way Identikit initialisation options are handled. These are described in the document *Deploying your visualisations*. For the most part, the old ways of initialising things are still supported, but not recommended (i.e. they are *deprecated*). So the chances are that the copy if *vis.html* that you use to run the Identikit whilst developing and testing your knowlege-base will still work. But we nevertheless recommend that you update your vis.html (or whatever you use) to reflect the new configuration options.

### Addition of *vism.html*
This new template high-level page is a version of *vis.html* which is configured specifically  to demonstrate the new mobile-first multi-access key on the provided *biscuits* knowledge-base. You can use this template to make a mobile-first multi-access key based on your own knowledge-base.

## Release 1.7.2
Minor release to implement a bug fix. Knowledge-base developers moving to version 1.7.2 from earlier versions should consult the notes below for version 1.7.0.

## Release 1.7.1
This was a minor update to address a couple of small bugs with 1.7.0. Knowledge-base developers moving to version 1.7.1 from earlier versions should consult the notes below for version 1.7.0.
## Release 1.7.0
Most of the significant changes to the Identikit with release 1.7.0 are architectural (i.e. 'under the hood') in preparation for significant changes coming later in 2018 when we will produce a multi-access key that is 'mobile-first' and suitable for delivering ID resources that can be used in the field. Nevertheless there have been one or two significant changes in this release. Most changes are backwards-compatible which means that knowledge-bases that were written for earlier releases will work unchanged with this new release. But if you want to capitalise on some of the improvements, you may need to make some changes as outlined below.

These notes are written from the point of view of a knowledge-base developer moving from version 1.6.0 to 1.7.0 of the framework, but the process should be pretty much the same if you are moving from an earlier version.

### Updating to release 1.7.0
The procedure for updating to a new release of the Identikit is the same as demonstrated in this video: http://www.fscbiodiversity.uk/fullscreen/tombiovis-upgrade. (The video was made when version 1.4.1 was released and was still referred to then as *the Framework*.)

If you encounter any problems doing this, email Rich Burkmar describing where you are coming unstuck: <r.burkmar@field-studies-council.org>

### New ability to include NBN distribution maps
Some Identikit features, e.g. the *Full taxon details* visualisation, are able to show distribution maps for taxa by using NBN web services. To make use of this feature, all you have to do is supply a column on the *Taxon* worksheet called *TVK* which contains the unique 'taxon version key' for each taxon. The *Building a knowledge-base* document has full instructions on how to use this feature and find the TVK values (see section *3.1.6 - NBN Mapping*).

### New image handling
On the *Media* worksheet you can now specify images by URL from elswhere on the web. When you do this, you simply supply the full URL (as opposed to the relative path of the image on your own computer/web server) and specify a value of *Image-web* for the *Type* column (as opposed to *Image-local* for images stored on your own computer/web server). 

The handling of all images has been imprroved by using a new control called *Galleria*, fixing problems causes by images of different dimensions resizing the interface and bringing other advantages. You can also include separate thumbnails and high-resolution images to improve your user's experience of working with images. These are specified on the *Media* worksheet as described in the *Building a knowledge-base* document (see section *3.4.2 - Images to illustrate taxa*).

### New media checking
There is now a facility for knowledge-base developers to check that the resources they reference in media sheet can actually be found. If you have the ‘checkKB’ option set to true (from your hosting web page - e.g. the 'test harness' *vis.html*), then Identikit puts an additional item on the *Select a tool* drop-down called *Check media files*. If you select this item, a report will be generated to indicate whether or not the files referenced in your knowledge-base can be found.

### New *state groups*
You can now group a large number of alternative state values for a single character into a single *state group* which you can use in the taxa worksheet instead of individually listing all the alternatives. This is really useful if more than one taxon needs to reference the same large group of alternatives (e.g. foodplants). You use the *Values* worksheet to define these state groups as described in the *Building a knowledge-base* document (see section *3.3.5 - Specifying state groups*).

### New *novalue* state value
There is a new way to indicate cases on the *Taxon* worksheet where none of the possible states for the character are manifest for a particular taxon. It is an important way to distinguish between empty cells – representing missing values – and those where the character does not manifest itself for the taxon because they score differently. It has a different meaning - and scores differently from the value 'n/a' (not applicable) and is most useful for characters which describe highly distinctive features of certain taxa but which are not meaningful for most taxa. (See section *3.1.4 - Special character state values* of the *Building a knowledge-base* document).

### Move from *Strictness* to *Latitude*
From version 1.7.0, the *Strictness* column is deprecated in favour of the new *Latitude* column. So *Strictness* will still work for now, but you are urged to change to *Latitude*. Predicting the results of the values you supply for *Latitude* is much easier than for *Strictness*. For full details on using *Latitude*, see the section *3.2.9 - The Latitude column* of the *Building a knowledge-base* document.

### Recommendataion to use Notepad++ to edit HTML
We provide *vis.html* as a kind of test harness that you can use to host the Identikit whilst you are developing and testing a knowledge-base. Previously we have recommended that you use a simple text editor such as Windows Notepad, to edit this (as shown in the video demonstrating updating a release installation). But as the Identikit matures, more options can be specified in the calling web page and editing with Notepad is increasingly difficult. For editing HTML files like these for Identikit, we are now recommending a more sophisticated editor (though still 'light-weight' and free) called *Notepad++*.

*Notepad++* is much more user-friendly for editing HTML than *Windows Notepad* – it will colour text and tags differently and use indentation to make the HTML much more readable. It makes it much less likely that you will make mistakes. You can download it here: https://notepad-plus-plus.org/download/v7.5.6.html.

We are also recommending this editor if you are creating HTML files to provide additional textual information for species in your knowledge-base. Previously we proposed that you could use an editor like *Microsoft Word* to create your text files and then use 'Save As...' to create HTML documents from these. This approach creates problems as describe in the section *3.4.4 - HTML files to provide further information on taxa* of the document *Building a knowledge-base*. If you already have many HTML files created with Microsoft Word and you are not having any problems, then don't worry - all should be well. But be aware that this new version of the Identikit handles HTML files a little differently, so you will want to test your files when you've updated to the new release.

### Changes to *vis.html*
We've made a number of changes to the way Identikit initialisation options are handled. These are described in the document *Deploying your visualisations*. For the most part, the old ways of initialising things are still supported, but not recommended (i.e. they are *deprecated*). So the chances are that the copy if *vis.html* that you use to run the Identikit whilst developing and testing your knowlege-base will still work.

However, one change that you need likely want to incorporate is the addition of this line:

`<script src="https://cdnjs.cloudflare.com/ajax/libs/core-js/2.5.6/core.min.js"></script>`

This is the inclusion of a Javascript file which will help older browsers work with some new features of Javascript used by the new release of Identikit.

We strongly recommend that instead of trying to update your current test HTML page, you create a new one based on that supplied with the new release and modify this to reflect any configuration options you changed in your old copy - most importantly the path to your knowledge-base folder.

(And remember we recommend that you download and use Notepad++ to edit it.)

### Using the new version of the Excel knowledge-base
The Excel knowledge-base template (*Biscuits.xlsm*) has been updated to reflect the addition of new columns (e.g. the change from *Strictness* to *Latitude* on the *Characters* worksheet - see above) and changes to some of the macros.

In all likelihood, the new release will work just fine with your old knowledge-base. If you need to alter anything in your knowledge-base to take advantage of new features (e.g. adding a column to one of the worksheets), it will be easy for you to simply update your current knowledge-base spreadsheet. The difficulty is if you want to take advantage of changes to the macros. For example release 1.7.0 includes a fix to the macro which creates the *CSV* files to overcome some problems with the display non-standard (e.g. accented) characters. If you want to take advantage of that, you will need to update your knowedge-base.

It is easier to copy your knowledge-base worksheets into a new copy of the template that already includes the new macros than it is to copy the new macro code to your current knowledge-base. We've described how you can do that in this new video: https://youtu.be/6E7Z9xewNng											










