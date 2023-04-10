(function($){

  $('#app').on('DOMNodeInserted', function(e) {  
    
    
    fixedPlace(); 
    
    $('.blocks-accordion__title .fr-view').each(function(){
      var text = $(this).text(),
          textTrim = text.replace(/\s+/g, ' ').trim(),
          parent = $(this).closest('.noOutline');

      if(textTrim == "[icon]" || textTrim == "[icons]"){
        $(this).addClass('blocks-accordion__icon');
        parent.addClass('custom-accordion');
      } else if(textTrim == "REFERENCE(S)"){
        parent.addClass('custom-accordion');
      }       

    }); 
    
    //Set BackButton Title
    var title = $('.lesson-nav--previous .lesson-nav__link-text'),
        titleLink = title.closest('.lesson-nav-link__link').attr('href'),
        titleText = title.text();

    var newTitle = $('.nav-sidebar__outline-section-item__link[href="'+titleLink+'"]').text();
    if(titleText!= "HOME"){
      title.attr('name', newTitle);
    }

    //Set NextButton Title
    var titleNext = $('.lesson-nav--next .lesson-nav__link-text'),
    titleNextLink = titleNext.closest('.lesson-nav-link__link').attr('href'),
    titleNextText = titleNext.text();

    var newNextTitle = $('.nav-sidebar__outline-section-item__link[href="'+titleNextLink+'"]').text();
    // if(titleNextText!= "HOME"){
      titleNext.attr('name', newNextTitle);
    // }

    getActiveNavSection();
      
  });  
  
  window.addEventListener("hashchange", function(){    
    
    //Set BackButton Title
    var title = $('.lesson-nav--previous .lesson-nav__link-text'),
        titleLink = title.closest('.lesson-nav-link__link').attr('href'),
        titleText = title.text();

    var newTitle = $('.nav-sidebar__outline-section-item__link[href="'+titleLink+'"]').text();
    if(titleText!= "HOME"){
      title.text(newTitle);
    }

    //Set NextButton Title
    var titleNext = $('.lesson-nav--next .lesson-nav__link-text'),
    titleNextLink = titleNext.closest('.lesson-nav-link__link').attr('href'),
    titleNextText = titleNext.text();

    var newNextTitle = $('.nav-sidebar__outline-section-item__link[href="'+titleNextLink+'"]').text();
    // if(titleNextText!= "HOME"){
      titleNext.text(newNextTitle);
    // }

    getActiveNavSection();
        
  });

})(jQuery); 

function getActiveNavSection (){
  var toggleBtnParent = $('.nav-sidebar__outline-section-item__link.active').closest('.nav-sidebar__outline-item'),
  toggleBtnAttr = toggleBtnParent.find('.nav-sidebar__outline-section-toggle').attr('aria-controls');

  console.log(toggleBtnAttr)
  $('#app #innerApp').removeClass("sidebar-sublist-0 sidebar-sublist-1 sidebar-sublist-2 sidebar-sublist-3 sidebar-sublist-4 sidebar-sublist-5");

  if(toggleBtnAttr==undefined){
    $('#app #innerApp').addClass('sidebar-sublist-0');
  } else{
    $('#app #innerApp').addClass(toggleBtnAttr);
  }
  

  console.log('toggleBtnAttr '+toggleBtnAttr)
}
  
// These css selectors select the Notes and select the contents of each Note
var noteSelector =  ".block-impact--note .block-impact__row"; // "[aria-label='Note']";
var noteContentsSelector = '.fr-view';

// These are the flags that must appear at the first line of the Note or the
// Note will not be successfully processed
var flagEntry = "Floating Modal";

// These are the labels that accompany the data. These must be entered exactly
// correct or the Note will not be successfully processed
var sectionlabel = "Section:";
var promptlabel = "Prompt:";
var linklabel = "Link:";

$(document).ready(function() {
  initialProcessNotes();
  addEvents();

  // fixedPlace(); 
  $(window).on('resize', function(){
    fixedPlace(); 
  });
})

/**
  * @desc add eventlisteners so that the func processNotes is fired when appropriate
  * @param none
  * @return none
*/
function addEvents() {

  // fire processNotes when the url changes
  function hashchanged(){
    processNotes();
  }
  window.addEventListener("hashchange", hashchanged, false);

  // fire processNotes when the CONTINUE button is clicked and new blocks are dynamically added
  function nodeadded(event) {
    if( event.relatedNode.nodeName == "SECTION" ) {
      if ( event.relatedNode.className == "blocks-lesson" ) {
        processNotes();
      }
    }

  }
  window.addEventListener("DOMNodeInserted", nodeadded, false);   
}

/**
  * @desc Run processNotes several times when the page first loads
  * @return none
*/
function initialProcessNotes(  ) {
  var MAX_INSTANCES = 5;
  var instances = 0;
  var myInterval = setInterval(myTimerProcessNotes, 300);
  function myTimerProcessNotes() {
    instances++;
    if (instances === MAX_INSTANCES ) {
      clearInterval(myInterval);
    }
    if (processNotes()) { clearInterval(myInterval) }
  }
}

/**
  * @desc Create Section object
  * @param string title - title of section
  * @param string introtitle - title of the section intro that appears in printed journal
  * @param string introtext - text of the section intro that appears in printed journal
  * @return none
*/
function Section( title, order, introtitle, introtext ) {
  if (!order) {
    order = 999
  }
    this["title"] = title;
    this["order"] = order;
    this["entries"] = [];
    introtitle = (introtitle) ? introtitle : '';
    this["introtitle"] = introtitle; // optional
    introtext = (introtext) ? introtext : '';
    this["introtext"] = introtext; // optional
}


/**
  * @desc Create Entry object
  * @param string section - which section does this entry belong in (linked to a Section object)
  * @param string prompt - text of the prompt
  * @param string response - text of the response (blank if new)
  * @param bool isTakeAction - is this a Take Action?
  * @return none
*/
function Entry( section, link, prompt ) {
	this["section"] = section;
	this["prompt"] = prompt;
  this["link"] = link;
}

/**
  * @desc This is the workhorse of the learning journal. It finds all the Notes on the page
  *   and processes them depending on what type of Note it is
  * @param none
  * @return true if Notes were found
*/
function processNotes() {

  var $notes = $(noteSelector);
  var returnValue = ($notes.length > 0) ? true : false ;

  // console.log($notes)

  $notes.each( function() {
    switch (this.querySelector(noteContentsSelector).firstChild.innerText.trim()) {
      case flagEntry:
        processEntry( this );
        this.parentNode.removeChild(this);
        fixedPlace();
        break;

      default:
        break;
    }

  });

  return returnValue;
}

/**
  * @desc This processes an Entry. If successful, it updates UserData
  *   and renders the entry to DOM
  * @param jQueryObject note - the note to be processed
  * @return none
*/
function processEntry( note ) {

  var entry = createEntryfromNote( note );
  // console.log(entry)
  if ( entry ) {

    // use indexSection and indexEntry to determine if this is a new section and entry
    var indexSection = -1; indexEntry = -1;   

    renderEntrytoDOM( note.parentNode, entry, indexSection, indexEntry );
  }
}

/**
  * @desc renders an Entry to DOM.
  * @param DOMElement parentcontainer - entry's parent container
  * @param Entry entry - the entry
  * @param string sectionid - the id of the corresponding section in UserData.Sections
  * @param string entryid - the id on the entry within UserData.Sections
  * @return none
*/
function renderEntrytoDOM( parentcontainer, entry, sectionid, entryid ) {

  $('.blocks-lesson').addClass('has-modal');
  
  // create container
  var container = document.createElement("div");
  container.className = "floating-modal";
  container.dataset.sectionid = sectionid;
  container.dataset.entryid = entryid;
  
  // create title
  var title = document.createElement("div");
  var titleSpan = document.createElement("span");  
  title.className = "floating-modal__title";
  titleSpan.innerHTML = entry.section;
  title.appendChild( titleSpan );
  container.appendChild( title );

  // create prompt
  var prompt = document.createElement("div");
  prompt.className = "floating-modal__prompt";
  prompt.innerHTML = entry.prompt;
  container.appendChild( prompt );

  // create prompt
  var link = document.createElement("div");
  link.className = "floating-modal__link";
  link.innerHTML = entry.link;
  container.appendChild( link );
  
  parentcontainer.appendChild(container);

  $( ".block-impact--note:has( .floating-modal)").addClass("block-impact--note-floatingmodal");  
}


/**
  * @desc creates an Entry object from a Note.
  * @param DOMElement note - note from which to create the entry
  * @return Entry object or null if fail (section or prompt is empty)
*/
function createEntryfromNote( note ) {

  var section = '',
      prompt = '';

var notecontents = note.querySelector(noteContentsSelector);
// console.log(notecontents)

var htmlText = "";

for (var i = 0; i< notecontents.childNodes.length; i++ ) {
  var a = notecontents.childNodes[i];
  

  // console.log(a)

  // set the section
  if ( a.innerText.substring(0,sectionlabel.length) == sectionlabel ) {
    section = a.innerText.substring(sectionlabel.length).trim();
  }
  // set the prompt
  if ( a.innerText.substring(0,promptlabel.length) == promptlabel ) {
    prompt = a.innerText.replace(promptlabel, "").trim();
  }
  if ( a.innerText.substring(0,linklabel.length) == linklabel ) {
    link = a.outerHTML;
  }
  if(a.innerText.substring(0,sectionlabel.length) != sectionlabel && a.innerText.substring(0,promptlabel.length) != promptlabel && a.innerText.substring(0,flagEntry.length) != flagEntry && a.innerText.substring(0,linklabel.length) != linklabel){
    var newHtml = a.outerHTML;
    htmlText = htmlText + newHtml;
  }
}

  if (section != '') {
    return new Entry( section, link, htmlText); // response is added later
  } else {
    return null;
  }
}


//Toggle Floating modal on mobile
var count = 0;
$(document).on('click', '.floating-modal__title', function(){
  // console.log('click')
  if(count==0){
    count++;
    $(this).closest('.block-impact__container').addClass('open');
  }else{
    count=0;
    $(this).closest('.block-impact__container').removeClass('open');            
  }  
});

$(document).on('click', '.page-menu-toggle', function(){

  // console.log('click');
  setTimeout(fixedPlace, 500);
});

function fixedPlace() {  
  if (1400 < window.innerWidth) {
    // console.log('fixedPlace');
    // console.log($('.lesson-header'))

    if($('.lesson-header').length){    
      var leftOffset = $('.lesson-header').offset().left,
          contentWidth = $('.lesson-header').outerWidth();
      
      var elFixed = $('#app .block-impact--note-floatingmodal .block-impact__container');
        
      if(elFixed.length){

        var fixedBlockWidth = $('.block-impact--note-floatingmodal .block-impact__container').outerWidth();
        if (fixedBlockWidth>350){
          fixedBlockWidth = 350;
        }      

        var leftPosition = leftOffset + contentWidth + 10;
        elFixed.css({
          left: leftPosition,
        });   
        
      }
    }
  }
}