/**
 * Settings
 */
/* The number of colomns visible at launch */
var requestedColumns = 2;

/* The proportion of the cards */
var cardPropositions = 1.38;

/* Scale the cards dynamicly or fixed  */
var dynamicColumns = false;

/* The width of a detailCard */
var detailColumnWidth = 600;

/* Path to the JSON */
var cardPath = 'cards/cards.json';


/**
 * System variables
 */
var localData;
var exportData;
var cards = {};
var draggedCards = new Array();
var cardObjects = new Array();
var clonesContainer = new Array();
var clientHeight, clientWidth;
var i = 0;
var columns = 0;
var did = 0;
var currentSet = 1;
var currentCategory = 1;
var sidebarOpen, annotationsOpen;
var annotationDefault, moduleTitleDefault, arrangmentTitleDefault, objectiveTitleDefault, globalAnnotationDefault;
var selectedCard;
var cardOpen;
var tr = false;
var animate = false;
var currentButton = "setupButton";
var currentModule;
var currentCard;
var selectedCard;
var cancelClick = false;
var created = false;
var loadID = 0;
var loaded = false;
var oldWidth = 0;
var cardRemoveID = 0;


/**
 * Start of the actual code
 */
$(document).ready(function(){
    init();
    
    /**
     * Initialise the application
     */
    function init(){
		// Clear localstorage
		//localStorage.clear();
		
		// hide the loading
		$('#loadBox').hide();
		$('#closeModalButton').hide();
		
		loadData();
		
        // Attach eventListeners
        $(window).bind("resize", resizeListener);
        
		$('#addModule').click(function(){
            addModule();
        });
		
		$('#closeAnnotateModule').click(function(){
			closeAnnotations();
		});
        
		$('.openSidebarButton').click(function(){
            toggleSidebar();
        });
		
		$('#titleFormInput').focus(function(event){
			clearDefaults(event);
		});
		
		$('#objectiveFormInput').focus(function(event){
			clearDefaults(event);
		});
		
		$('#annotationPrintArea').focus(function(event){
			clearDefaults(event);
		});
		
		$(window).scroll(function() {
  			resizeModal();
		});
		
		$('#cancelButton').click(function(event){
			cancelModal();
		});
		
		$('#startButton').click(function(event){
			createArrangment();
		});
		
		$('#setupButton').click(function(event){
			menuClickHandler(event);
		});
		
		$('#arrangeButton').click(function(event){
			menuClickHandler(event);
		});
		
		$('#finishButton').click(function(event){
			menuClickHandler(event);
		});
		
		$('#printButton').click(function(event){
			window.print();
		});
		
		$('#saveButton').click(function(event){
			saveArrangement();
		});
		
		$('#loadButton').click(function(event){
			loadArrangement();
		});
		
		$('#closeModalButton').click(function(event){
			closeModal();
		});
		
		$('#leftNavButton').click(function(event){
			sidebarNav(event);
		});
		
		$('#rightNavButton').click(function(event){
			sidebarNav(event);
		});
		
		
        // Resize content
        resizeListener(null);
		
        // Create the columns
        createColumns();
		
		// Open the sidebar
		toggleSidebar();
     
		// Save default form values (to clear the input on the first click)
		annotationDefault = $('.annotationsInput').first().val();
		moduleTitleDefault = $('.titleInput').first().val();
		arrangmentTitleDefault = $('#titleFormInput').val();
		objectiveTitleDefault = $('#objectiveFormInput').val();	
		globalAnnotationDefault = $('#annotationPrintArea').val();
    }
	
	 /**
     * Data
     */	
	/**
	 * Load the cards from the JSON file
	 */
	function loadData(){
		// lets get the cards first
		$.ajax({
			dataType: 'text',
			success: function(string) {
				cards = $.parseJSON(string).cards;
				createCards();
		    },
		    url: cardPath
		});
		
		// get data from localstorage
		localData = localStorage.getItem('arrangements');
		
		if(localData === null){
			localData = "";
		}else{
			localData = $.parseJSON(localData);
			
			// wow great! lets show the load dropdown
			createLoadMenu();
		}
	
		//console.log(localData);
	}
	
	/**
	 * show a dropdown
	 */
	function createLoadMenu(){
		var options = "";
		for(var i = 0; i< localData.viewpoints.length; i++){
			options += '<option>' + localData.viewpoints[i].arrangement[0].title + '</option>'
		}
		
		$('#loadList').append(options);
		$('#loadBox').show();
	}
	
	/**
	 * Saves the arrangement in the localstorage
	 */
	function saveArrangement(){
		// generate the json of the current arrangement
		var newObject = collectData(true);
		var arrangementSave;
		
		// create a new localstorage object
		if (localData == "") {
			arrangementSave = '{ "viewpoints": [';
			arrangementSave += JSON.stringify(newObject);
			arrangementSave += ']}'
		}else {
			if(loaded){
				// update the current arrangement
				//console.log(newObject);
				localData.viewpoints.splice(loadID,1,newObject);  
			}else{
				// just add the new arrangment to the localstorage
				localData.viewpoints.push(newObject);
			}
			arrangementSave = JSON.stringify(localData);
		}
		
		$('#saveButton').attr("disabled", "true");
		localStorage.setItem("arrangements", arrangementSave);	
		
	}
	
	/**
	 * Load an arrangement from the localstorage
	 */
	function loadArrangement(){
		loaded = true;
		created = true;
		did = 0;
		
		// get the selected arrangement
		var loadedArrangment = localData.viewpoints[$("#loadList").attr("selectedIndex")];
		loadID = $("#loadList").attr("selectedIndex");
		
		// clear all the current data
		$('.module').slice(1).remove();
		
		// get the modules
		var modules = loadedArrangment.arrangement[1].modules;
		//console.log(modules);
		
		// draggedcards
		draggedCards = new Array();
		
		for (var i = 0; i < modules.length; i++) {
			// add a module
			addModule();
			
			// add the cards to the module
			for(var j=0; j<modules[i].cards.length; j++){
				
				var cardID = modules[i].cards[j].card_id;
				var lastModule = $('.module').last();
				var dataCard = cards[modules[i].cards[j].card_id-1];
				
				// set the title + annotations of a module
				$('.titleInput' , lastModule).val(modules[i].module_title);
				$('.annotationsInput', lastModule).val(modules[i].module_annotations);
				
				$('.cardHolder' , lastModule).each(function(currentElement, index) {
					if($(this).children().size() === 0){
						
						var cardDiv = $('.cardDrag').children(":first").first().clone().appendTo(this);
						$(cardDiv).removeAttr('class').removeAttr('style').attr('class', 'sortCard');
						$(cardDiv).css({'background' : dataCard.background, 'opacity': 100});
						$('h1',cardDiv).text(dataCard.title);
	
						var cardt = '{';
						cardt += '"category_id":"' + dataCard.category_id + '",';
						cardt += '"card_id":"' + dataCard.card_id + '",';
						cardt += '"title":"' + dataCard.title + '",';
						cardt += '"info":"' + dataCard.info + '",';
						cardt += '"icon":"' + dataCard.icon + '",';
						cardt += '"background":"' + dataCard.background + '",';
						cardt += '"checkitems":[';
						
						for (var d = 0; d < modules[i].cards[j].checkitems.length; d++) {
							cardt += '{"checked":"' + modules[i].cards[j].checkitems[d].checked + '",';
							cardt += '"item":' + ' "'+ modules[i].cards[j].checkitems[d].item+'"}';
				
							if(d < (modules[i].cards[j].checkitems.length-1)){
								cardt += ',';	
							}
						}					
						cardt += ']}';
					
						var currentCardStorage = jQuery.parseJSON(cardt);
						draggedCards.push(currentCardStorage);
						
						$(cardDiv).attr('did', did);
						$(cardDiv).attr('data-id', cardID);
						did++;
						
						$(cardDiv).sortable({
							invalid: true,
							scroll: true,
							tolerance: 'pointer',
							items: $('.cardHolder'),
							forcePlaceholderSize: true,
							revert: 100,
							delay: 0,
							stop: function(){
								// check if column has the proper amount of cards
								checkCols();
							},
							start: function(event, ui){
								cancelClick = true;
						
								if($('.module').hasClass('activeModule')){
									if(!animate){
										 alert("Please close the selected card before sorting.");
									}
								}
							}
						});
						
						$(cardDiv).click(function(event){
							openCardDetail(event);
						});
								
						return false;
					}
				});
			}
		}
	
		$('#overlay').fadeOut(200);
		$('#createModal').fadeOut(200).delay(400);
		
		$('#titleInput').val(loadedArrangment.arrangement[0].title);
		$('#objectiveInput').val(loadedArrangment.arrangement[0].objective);
	
		$("#" + currentButton).removeClass('selected');
		$('#arrangeButton').addClass('selected');
		currentButton = "arrangeButton";	
		
		checkModal();
	}
	
	
	/**
	 * Collect the data for print or saving
	 * Generates JSON
	 */
	function collectData(returnObject){
		var data = '{"arrangement":[';
		var moduleIndex = 1;
		
		// application data
		data += '{';
		data += '"objective":"' + $('#objectiveInput').val() + '",';
		data += '"title":"' + $('#titleInput').val() + '",';
		data += '"globalAnnotations":"' + $('#annotationPrintArea').val() + '"';
		data += '},';
		data += '{"modules":[';
		
		// loop trough the moduls but don't include the template
		$('.module').slice(1).each(function() {
			
			// get general info
			data += '{"module_id":"' + moduleIndex + '",';
			data += '"module_title":"' + $('.titleInput', this).val() + '",';
			
			var annotations = $('.annotationsInput', this).val();
			if(annotations == $('#template .annotationsInput').val()){
				annotations = "";
			}
			
			data += '"module_annotations":"' + annotations + '",';
			data += '"cards":[';
			
			var lastIndex = 0;
			var cardSize = $('.sortCard',this).size();
			$('.sortCard',this).each(function(){
				lastIndex++;
				
				//console.log($(this).attr('did'));
				
				var dataCard = draggedCards[$(this).attr('did')];
				/*if(dataCard.card_id == -1){
					alert("yes");
				}*/
				data += '{"card_id":"' + dataCard.card_id + '",';
				data += '"category_id":"' + dataCard.category_id +'"';
				data += ',"checkitems": [';
		
				// get the checked items on the card + the order
				var checkItems = [];
				for (var j = 0; j < dataCard.checkitems.length; j++) {
					// only the checked items should be included in the data
					if(returnObject == true){
						data += '{"item":"' + dataCard.checkitems[j].item + '", "checked":"' + dataCard.checkitems[j].checked + '"},';
						checkItems.push(dataCard.checkitems[j].item);
					}else{
						if(dataCard.checkitems[j].checked === "true"){
							data += '{"item":"' + dataCard.checkitems[j].item + '"},';
							checkItems.push(dataCard.checkitems[j].item);
						}
					}
				}
				if(checkItems.length != 0){
					data = data.slice(0,-1)
				}
				
				if(lastIndex == cardSize){
					data += ']}';	
				}else{
					data += ']},';	
				}
			});
			
			moduleIndex++;
			if(moduleIndex == ($('.module').size())){
				data += ']}';
			}else{
				data += ']},';
			}
		});
		
		data += "]}]}";
		exportData = jQuery.parseJSON( data );
	
		if(returnObject){
			return exportData;
		}
	}
	
	
	/**
	 * Generate a printable overview of the arrangement
	 */
	function generatePrintPreview(){
		$('#printPageHeader h1').text(exportData.arrangement[0].title);
		$('#objectivePrintArea').val(exportData.arrangement[0].objective);
		
		var modules = exportData.arrangement[1].modules;
		var printPreview = "";
		
		// lets create the columns
		for(var i=0; i < modules.length; i++){	
			printPreview += '<div class="printPreview"><div class="printContent">';
			printPreview += '<h2>' + modules[i].module_title + '</h2>'
			printPreview += '<h3>' + modules[i].module_annotations + '</h3>';
			printPreview += '<ol>';

			// cards
			for(var j=0; j<modules[i].cards.length; j++){
				var myIndex = (modules[i].cards[j].card_id)-1;
		
				printPreview += '<li>';
				printPreview += '<h4>' + cards[myIndex].title + '</h4>';
				printPreview += '<ul>';
				
				// questions
				for(var h=0; h<modules[i].cards[j].checkitems.length; h++){
					printPreview += '<li>';
					printPreview += modules[i].cards[j].checkitems[h].item;
					printPreview += '</li>';
				}
				
				printPreview += '</ul>';
				printPreview += '</li>';
			}
			
			printPreview += '</ol>';
			printPreview += "</div></div>"
		};
	
		$('.printPreview').remove();
		$('#printList').append(printPreview);
		//console.log(printPreview);
	}

		
    /**
     * Create DOM elements for the cards
     */
	function createCards(){
		var navIndex = 1;	
		var categories = new Array();
	
		for(var i = 0; i < cards.length; i++){		
			// store the current card in a variable
			var card = cards[i];
		
			// push the category
			categories.push(card.category_id);
			
			// clone and create the card
			var cardDiv = $('.cardDrag').first().clone().appendTo('#sidebarWrapper');
			
			// apply the dynamic data to the card
			$('.card').first().clone().attr('data-id', i+1).css({'background' : card.background, 'opacity': 100}).appendTo($('.cardDrag').last());	
			$('.card h1').last().text(card.title);
			
			clonesContainer.push(cardDiv);
			
			// set the drag & drop
			$('.card').last().draggable({
				revert: true
			});
				
			// do we need extra navigation in the sidebar 
			if(i % 3 == 0){
				$('.sidebarNavButton').first().clone().appendTo('#sidebarNavList').attr('data-id', navIndex);
				$('.sidebarNavButton').last().click(function(event){
           			 setNav(event)
        		});
				navIndex++;
			} 
		
			cardObjects.push(cardDiv);
		}
		
		// sort the cards by category (WORK IN PROGRESS ***)
		var compA, compB;
		
		cards.sort(function(a, b){
			compA = a.category_id;
			compB = b.category_id;
		
			return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
		});
		
		$('.sidebarNavButton').first().remove();
		$('.cardDrag').first().remove();
		
		setNav();
	}
	
	
    /**
     * Create the requested amount of columns
     */
    function createColumns(){
        for (var j = 0; j < requestedColumns; j++) {
            addModule();
        }
    }
	
    
    /**
     * Calculate the height of the document
     */
    function calculateWindowSize(){
        clientHeight = $(document).height();
        clientWidth = $(document).width();
    }
	
    
    /**
     * Set the layout (do this when resizing the browser)
     */
    function setLayout(){
        $('#leftSidebar').css({
            'height': clientHeight - $('#header').height()
        });
        
        $('#rightSidebar').css({
            'height': clientHeight - $('#header').height()
        });
        
        $('#rightSidebarOpen').css({
            'height': clientHeight - $('#header').height()
        });
	
        $('#header').css({
            'width': $(window).width()
        });
		
		$('#sidebarContent').css({
            'height': clientHeight - $('#header').height() - $('#categorymenu').height()
        });
		
		$('#overlay').css({
			'height': $(window).height()
		});
		
		scaleColumns();
    }
    
	
    /**
     * Catch browser resize
     */
    function resizeListener(event){
        calculateWindowSize();
        setLayout();
		resizeModal();
    }
    
	
    /**
     * Functionality
     */
	
	
    /**
     * Add a new module
     */
    function addModule(event){
        // create a new ID
        i++;
        columns++;
        
        // clone from template
       	$('#template').clone().attr('id', '').attr('data-id', i).appendTo('#module_container');
        
        // scale
        scaleColumns();
		
		$('.moduleAnnotations').last().click(function(event){
			toggleAnnotations(event);
		});
		
		$('.titleInput').click(function(event){
			clearModuleTitle(event);
		});
		
		// enable the dropping on the columns
		var lastModule = $('.module').last();
		
		// order columns
		$('.module').last().sortable({	
			invalid: true, 
			scroll: true,
			items: $('.module'),
			forcePlaceholderSize: true,  
			revert: 200,  
			delay: 0,  
			handle: $('.moduleTitle'),
			tolerance: 'pointer'
        });
		
		addDropable();
		addSorting();
    }
    
	
	/**
	 * Add sorting functionality
	 */
	function addSorting()
	{
		// add sorting
		$('.module .sortCard').sortable({
			invalid: true,
			scroll: true,
			items: $('.cardHolder'),
			forcePlaceholderSize: true,
			revert: 100,
			delay: 0,
			tolerance: 'pointer',
			stop: function(){
				// check if column has the proper amount of cards
				checkCols();
				tr = false;
			},
			start: function(event, ui){
				$('.modules').css({
					'height': $('#modules').height() + 200
				});
				
				if($('.module').hasClass('activeModule')){
					if(!animate){
						 alert("Please close the selected card before sorting.");
					}
				}
			},
		});
	}
	
	
	/**
	 * Add drop functionality
	 */
	function addDropable(){
		
		// clone the dragged cards
		$('.cardHolder').droppable({
	        tolerance: 'touch',
			over: function() {
				$(this).css('backgroundColor', '#FFF');
			},
			out: function() {
				$('.cardHolder').css('backgroundColor', '#FFF');
			},	
	        drop: function(event, ui) {
				if(!$(this).parent().parent().parent().hasClass('activeModule')){
				
				$('.cardHolder').css('backgroundColor', '#FFF');
				
				if (ui.helper.hasClass("card ui-draggable")) {
					var element = $(ui.helper).clone();
					
					// check if a column contains a cards		
					if ($('.sortCard', this).size() == 0) {
						// card has to be cloned into the column
						element.appendTo(this);
					}
					else {
						// we have to create a new holder for the card
						var holder = $('.cardHolder').first().clone().insertBefore(this);
						element.appendTo(holder);
					}
				
					// rewrite the css of the cloned cards
					$(element).removeAttr('class').removeAttr('style').attr('class', 'sortCard');
					$(element).attr('did', did);
					
					// extract the data from the json and create a new card object
					var ind = $(element).attr('data-id')-1;
					var theCard = cards[ind];
					var cardt = '{';
					cardt += '"category_id":"' + theCard.category_id + '",';
					cardt += '"card_id":"' + theCard.card_id + '",';
					cardt += '"title":"' + theCard.title + '",';
					cardt += '"info":"' + theCard.info + '",';
					cardt += '"icon":"' + theCard.icon + '",';
					cardt += '"background":"' + theCard.background + '",';
					cardt += '"checkitems":[';
					
					for (var i = 0; i < theCard.checkitems.length; i++) {
						cardt += '{"checked":"false",';
						cardt += '"item":' + ' "'+theCard.checkitems[i].item+'"}';
						
						if(i < (theCard.checkitems.length-1)){
							cardt += ',';	
						}
					}					
					cardt += ']}';

					var currentCardStorage = jQuery.parseJSON(cardt);
					$(element).css({
						'background': currentCardStorage.background
					});
					
					did++;
					draggedCards.push(currentCardStorage);
					addSorting();
					
					// add click handler	
					$(element).click(function(event){
						openCardDetail(event);
					});
					
					if($('.module').hasClass('activeModule')){
							$('.module .sortCard').sortable("disable");
						}
					}
				}
	        }
		});
	}
	
	
	/**
	 * Check if each module has a draggable element
	 * This is avoid ending up with empty columns
	 */
	function checkCols(){
		// => Check if a column has 1 cardholder
		$('.module').each(function(index) {
			
			// if not add a new one
			if(!$(this).children().children().children().hasClass('cardHolder')){
				$('.cardHolder').first().clone().appendTo($('.cardWrapper',this));
				addSorting();
				addDropable();
			}
  		});
	}
	
	
    /**
     * Scale columns, add scrollbar if needed
     */
	var heightD = 0;
    function scaleColumns(){
		
		// scale the columns dynamicly?
		var scaleParameter = Math.floor((clientWidth / columns) - 20);
		var minWidth = parseInt($('.module').css('min-width'), 10);
    
		if (scaleParameter < minWidth || scaleColumns > 4 || !dynamicColumns) {
            // adjust the width of the container
            var value;
            value = $('.module').width() * i;
			
			value = 0;
			$('.module').each(function(index) {
				value = value + $(this).width();
  			});
			
			value = value - $('#template').width();
			
            $('#module_container').css({
                'width': value
            });
            
            var value2 = value + 2 * $('#leftSidebar').width();
            if (value2 > clientWidth) {
                $('body').css({
                    'width': value2
                });
                
                $('.module').css({
                    'width': minWidth,
                });
						
				$('.activeModule').css({
					'width': detailColumnWidth
				})
            }
		
    	}else {
		
            $('.module').css({
                'width': scaleParameter
            });
			
			$('.activeModule').css({
				'width': detailColumnWidth
			})
        }
       
        // get the original proportions of a card
        var cardWidth = ($('.module').width() / 100) * 80;
        var cardHeight = cardWidth / cardPropositions;
        
    	// resize the cards proportionaly 
		$('.module').each(function(index) {
			if ($(this).hasClass("activeModule")) {
			
			}else{
				$('.cardHolder', this).css({
		            'width': cardWidth
		        });
		        $('.cardHolder', this).css({
		            'height': cardHeight
		        });
			}
  		});
    }
    
	
    /**
     * Opens or closes the sidebar
     */
    function toggleSidebar(event){
        if (!sidebarOpen) {
		    $('#rightSidebarOpen').css({
                'display': 'inline'
            }).css({
                'right': -$("#rightSidebarOpen").width()
            }).animate({
			    "right": "0px",
			  }, {
			    duration: 200,
			    specialEasing: {
			      width: 'linear',
			      height: 'easeOutBounce'
			    },
				complete: function() {
					$('#sidebarNavigationWrapper').fadeIn(200);
				}
			});
            sidebarOpen = true;
        }
        else {
			$('#sidebarNavigationWrapper').fadeOut(200, function() {
				 $('#rightSidebarOpen').animate({
			    "right": -$("#rightSidebarOpen").width()
			  }, {
			    duration: 200,
			    specialEasing: {
			      width: 'linear',
			      height: 'easeOutBounce'
			    },
				complete: function() {
					$('#sidebarNavigationWrapper').fadeOut(200);
				}
				});
			});
            sidebarOpen = false;
        }
    }
	
	/**
	 * Opens the annotations input fields
	 */
	function toggleAnnotations(event){
		if(event)
		{
			 if($(event.target).val() == annotationDefault){
			 	$(event.target).val("");
			 }
		}
		
		if(!annotationsOpen){
			$('.moduleAnnotations').animate({
			    'height': 200
			  },{duration: 200, 
				complete: function() {
					$('#closeAnnotateModule').fadeIn(200).css({'cursor':'pointer'});
				}
			});
			
			$('.annotationsInput').animate({
				'height': 192
			});
			
			annotationsOpen = true;
		}
	}
	
	
	/**
	 * Closes the annotations input fields
	 */
	function closeAnnotations(event){
		$('.moduleAnnotations').animate({
			'height': 35
		});
		
		$('#closeAnnotateModule').fadeOut(200).css({'cursor':'default'});
		
		$('.annotationsInput').animate({
			'height': 27
		});
		
		annotationsOpen = false;
	}
	
	
	/**
	 * Reset the data on the input fields
	 */
	function clearModuleTitle(event){
		if($(event.target).val() === moduleTitleDefault){
			 $(event.target).val("");
			 $(event.target).css({'border': '1px dashed #979797'});
		}
	}
	function clearDefaults(event){
		switch(event.target.id){
			case "titleFormInput":
				if($('#titleFormInput').val() === arrangmentTitleDefault){
					$('#titleFormInput').val("");
				}
			break;
			
			case "objectiveFormInput":
				if($('#objectiveFormInput').val() === objectiveTitleDefault){
					$('#objectiveFormInput').val("");
				}
			break;
			
			case "annotationPrintArea":			
				if($('#annotationPrintArea').val() === globalAnnotationDefault){
					$('#annotationPrintArea').val("");
				}
			break;
		}
	}
	
	
	/**
	 * Opens or closes card detail info (this function applies the annimation to the colmns)
	 */	
	function openCardDetail(event){	
		
		var cardWidth, cardHeight;
	
		if (cancelClick == false) {
		
			if (!cardOpen) {
				openCard(event.currentTarget);
			}
			else {
						
				// Sluiten van de huidige kaart door op de header te klikken
				if ($(event.target).attr('class') === 'cardHead' || $(event.target).attr('id') === "trashIcon"){
				
					cardOpen = false;
					$('.questionList', selectedCard).remove();
					$('#trashIcon').remove();
					$('h2', selectedCard).remove();
					$('h1', selectedCard).show();
					
					// get the original proportions of the card
					cardWidth = parseInt($('.module').css('min-width'), 10);
					cardHeight = cardWidth / cardPropositions;
					
					$('.cardHolder', currentModule).css({
						'min-height': 0
					});
					$(selectedCard).parent().css({
						'min-height': 0
					});
					$('.cardHolder', currentModule).css({
						'width': cardWidth,
						'height': cardHeight
					});
					$(currentModule).removeClass('activeModule').css({
						'width': parseInt($('.module').css('min-width'), 10)
					});
					
					// remove the card 
					if($(event.target).attr('id') === "trashIcon"){
						$(selectedCard).remove();
						
						// remove from data
						draggedCards[cardRemoveID].card_id = -1; 
					}else{
						resort();		
					}
					
								
				// close the current card when a user clicks on a different one
				}else {
				
					resort();
				
					if (event.currentTarget != selectedCard) {
						cardOpen = false;
						$('.questionList', selectedCard).remove();
						$('h2', selectedCard).remove();
						$('h1', selectedCard).show();
						
						// get the original proportions of the card
						cardWidth = parseInt($('.module').css('min-width'), 10);
						cardHeight = cardWidth / cardPropositions;
										
						if ($(currentModule).hasClass('activeModule') && $(event.target).parent().parent().parent().parent().parent().hasClass('activeModule')) {
						
							if (selectedCard != event.currentTarget) {
								// user clicked on a different card
								openCard(event.currentTarget, false);
							}
							else {
							
							}
						}
						else {
							$('.cardHolder', currentModule).css({
								'min-height': 0
							});
							
							// downscale the cards
							$('.cardHolder', currentModule).css({
								'width': cardWidth,
								'height': cardHeight
							});
							
							$(currentModule).removeClass('activeModule').animate({
								'width': parseInt($('.module').css('min-width'), 10)
							}, {
								duration: 0,
								easing: 'swing',
								complete: function(){
									// get back to the original width
									$(currentModule).removeClass('activeModule').css({
										'width': parseInt($('.module').css('min-width'), 10)
									});
									openCard(event.currentTarget, true);
								}
							});
						}
						
						// reset the card
						$(selectedCard).removeClass('.selectedCard');
						
					}
				}
			}
			resizeListener(null);
		}else{
			cancelClick = false;
		}
	}
	
	
	/**
	 * Open a card + apply settings and classes
	 */
	function openCard(target, setWidth){
		
		if (!animate){
			$('.module .sortCard').sortable("disable");
			
			var checkedData = "";
			var moduleSet = false;
			animate = true;
			
			// save the currentcard(DOM element)
			selectedCard = target;
			
			// get the JSON object related to this card
			currentCard = draggedCards[$(selectedCard).attr('did')];
			
			cardRemoveID = $(selectedCard).attr('did');
		
			// get the current module
			currentModule = $(selectedCard).parent().parent().parent().parent();
			
			// give the wider column a new class
			$(currentModule).addClass('activeModule').css({
				'width': detailColumnWidth
			});
			
			// get the original proportions of the card
			cardWidth = (currentModule.width() / 100) * 80;
			cardHeight = cardWidth / cardPropositions;
			
			// apply proportional scaling to the card
			$(currentModule).find('.cardHolder').animate({
				'width': cardWidth,
				'height': cardHeight
			}, {
				animate: 0,
				complete: function(){
					// show the checklist
					$(selectedCard).flip({
						direction: 'tb',
						color: currentCard.background,
						speed: 200,
						onAnimation: function(){
							$('h1', selectedCard).hide();
							
							// create the content for the back of the card
							var questionList = '<img src="images/trash.png" id="trashIcon" alt=""/><h2 class="cardHead">' + currentCard.title + '</h2><ul class="questionList">';
							
							for (var i = 0; i < currentCard.checkitems.length; i++) {
								if (currentCard.checkitems[i].checked === "true") {
									checkedData = ' checked="true" ';
								}
								else {
									checkedData = '';
								}
								questionList += '<li><span class="checkBox" index-id="'+ i +'" data-id="'+ i +'"><input id="check'+ i +'" type="checkbox"' + checkedData + '/></span><label class="lab" for="check' + i + '">' + currentCard.checkitems[i].item + '</label></li>';
							}
							
							questionList += '<li><span class="checkBox"><input type="checkbox"  checked="true"/></span><p><textarea class="startContent" id="itemInput">Create a new item</textarea><button type="button">Add</button></p></li>';
							questionList += '</ul>';

							$(questionList).appendTo(selectedCard);
							
							$('#trashIcon').click(function(){
								openCardDetail(event);
							});
							
							// We got to rewrite the data!
							$('.questionList').sortable({
								stop: function(event, ui){
									
									// loop trough it
									var t = 0;
									var newItems = '[';
									var loopData = $('.questionList .checkBox');
									
									$.each($(loopData), function() {
										newItems += '{"checked":"'+ $('input:checkbox', this).attr('checked') + '",';
										newItems += '"item":' + ' "'+ $(this).parent().text() +'"}';
									
										t++;
										
										if(t == loopData.length -1){
											return false;
										}else{
											newItems += ',';
										}
									});
									
									newItems += ']';
									
									var newList = jQuery.parseJSON(newItems);
									currentCard.checkitems = newList
								}
							});
							$('.questionList').disableSelection();
							$(selectedCard).parent().css({
								'height': '100%',
							});
							
							// unbind the click handle
							$('#itemInput').click(function(){
								if ($('#itemInput').hasClass('startContent')) {
									$('#itemInput').val("").removeClass('startContent');
								}
							});
							
							$('.questionList button').click(function(){
								// add the item to the card
								var checkedData = "";
								var check;
								if ($('.questionList li:last input:checkbox').attr('checked') === true) {
									checkedData = ' checked="true" ';
									check = "true";
								}
								else {
									check = "false";
								}
								
								var strippedText = $('textarea#itemInput').val();
								var st = '<li><span class="checkBox"><input type="checkbox" ' + checkedData + ' /></span><p>' + strippedText + '</p></li>';
								$(st).insertBefore('.questionList li:last');
								
								// add the new item to the json object
								currentCard.checkitems.push({
									checked: check,
									item: strippedText
								});
								$('textarea#itemInput').val("");
							});
							
							$('.questionList input:checkbox').click(function(){
								var checked;
								
								if($(this).attr('checked') == true){
									checked = "true";
								}else{
									checked = "false";
								}
								
								// index from the list
								currentCard.checkitems[$(this).parent().parent().index()].checked = checked;
								//console.log(currentCard.checkitems[$(this).parent().parent().index()].checked);
							});
							
							// card
							cardOpen = true;
							
						},
						onEnd: function(){
							// resize the stage
							resizeListener(null);
							animate = false;
							
						}
					}, 200);
				}
			});
			
			
			$(selectedCard).parent().css({
				'min-height': cardHeight
			});
			$(selectedCard).addClass('.selectedCard');
			resizeListener(null);
		}
	}
	
	/**
	 * ReAdd The sorting functionality when closing a card
	 */
	function resort(){
		$(selectedCard).sortable({
			invalid: true,
			scroll: true,
			tolerance: 'pointer',
			items: $('.cardHolder'),
			forcePlaceholderSize: true,
			revert: 100,
			delay: 0,
			stop: function(){
				// check if column has the proper amount of cards
				checkCols();
			},
			start: function(event, ui){
				cancelClick = true;
		
				if($('.module').hasClass('activeModule')){
					if(!animate){
						 alert("Please close the selected card before sorting.");
					}
				}
			}
		});
		
		$('.module .sortCard').sortable( "enable" );
	}
	

	/**
	 * Menu and Navigation
	 */
	
	/**
	 * Navigate between the different screens
	 */
	var res = false;
	function menuClickHandler(event){
		switch (event.currentTarget.id) {
			case "setupButton":
				$('#overlay').fadeIn(200);
				$('#createModal').fadeIn(200).delay(400);
				$('#mainContent').show();
				$('#printPage').hide();
				$('#title').show();
				$('#objective').show();
				$('#titleFormInput').val($('#titleInput').val());
				$('#objectiveFormInput').val($('#objectiveInput').val());
				
				if(created){
					$('#createModal h1').text("Setup");
					$('#cancelButton').show();
					$('#startButton').text("New Arrangement");
				}
				res = false;
				resizeListener(null);
			break;
				
			case "finishButton":
				collectData(false);
				$('#mainContent').hide();
				$('#printPage').show();
				$('#title').hide();
				$('#objective').hide();
				oldWidth = $('body').width();
				$('body').css({'width': '100%'});
				$('#saveButton').removeAttr("disabled");
				
				// generate the export string
				generatePrintPreview();	
				res = true;
			break;
			
			case "arrangeButton":
				$('#mainContent').show();
				$('#printPage').hide();
				$('#title').show();
				$('#objective').show();
				
				resizeListener(null);
			break;
		}
		
		resizeModal();
		$("#" + currentButton).removeClass('selected');
		$(event.currentTarget).addClass('selected');
		currentButton = event.currentTarget.id;
	}
	
	/**
	 * Create a new arrangment (from the setup modal view)
	 */
	function createArrangment(){
		
		$('#overlay').fadeOut(200);
		$('#createModal').fadeOut(200).delay(400);
		
		$('#titleInput').val($('#titleFormInput').val());
		$('#objectiveInput').val($('#objectiveFormInput').val());
	
		$("#" + currentButton).removeClass('selected');
		$('#arrangeButton').addClass('selected');
		currentButton = "arrangeButton";	
		
		draggedCards = new Array();
		$('.module').slice(1).remove();
		createColumns();
		checkModal();
		
		// we've create an arrangement
		created = true;
		loaded = false;
	}
	
	/**
	 * Center the modal views
	 */
	function resizeModal(){
		if($('#overlay').is(":visible")){
			$('#overlay').css({'width': $(document).width(), 'height': $(document).height()});
			
			if($('#setupButton').hasClass('selected')){
				$('#createModal').css("margin-top", ( $(window).height() - $('#createModal').height() ) / 2+$(window).scrollTop() + "px");
				$('#createModal').css("margin-left", ( $(window).width() - $('#createModal').width() ) / 2+$(window).scrollLeft() + "px");
			}else{
				$('#finishModal').css("margin-top", ( $(window).height() - $('#createModal').height() ) / 2+$(window).scrollTop() + "px");
				$('#createModal').css("margin-left", ( $(window).width() - $('#createModal').width() ) / 2+$(window).scrollLeft() + "px");
			}
		}
	}
	
	/**
	 * Set the menu
	 */
	function setNav(event){
		// reset the navigation => should be rewritten
		$('.sidebarNavButton').css({'background':'#fff', '-moz-border-radius':'5px', 'border-radius':'5px', 'width':'10px', 'height':'10px', 'margin':'0 10px 0 10px'})

		// highlight the selected navigation
		if(event){
			$(event.target).css({'background':'#000', '-moz-border-radius':'2px', 'border-radius':'2px', 'width':'16px', 'height':'16px', 'margin':'-3px 5px 0 5px'});
			currentSet = $(event.target).attr('data-id');
		}else{
			$(".sidebarNavButton").first().css({'background':'#000', '-moz-border-radius':'2px', 'border-radius':'2px', 'width':'16px', 'height':'16px', 'margin':'-3px 5px 0 5px'});
		}
		
		// hide all cards
		$('.cardDrag').hide();
		
		// select the required cards
		var visibleCards = cardObjects.slice((currentSet*3)-3, currentSet*3);
		
		// show all the required cards
		for (var i = 0; i < visibleCards.length; i++) {
			visibleCards[i].fadeIn(200);
		}
	}
	
	function sidebarNav(event){
		$('.sidebarNavButton').css({'background':'#fff', '-moz-border-radius':'5px', 'border-radius':'5px', 'width':'10px', 'height':'10px', 'margin':'0 10px 0 10px'})
		$('.cardDrag').hide();
		$('#leftNavButton, #rightNavButton').css({'opacity':'1'})
		
		switch(event.target.id)
		{
			case "leftNavButton":
				if(currentSet > 1){
					currentSet = currentSet -1;
				}else{
					$(event.target).css({'opacity':'0.3'})
				}
			break;
			
			case "rightNavButton":
				if(currentSet < (cardObjects.length)/3){
					currentSet = currentSet +1;	
					
					if(currentSet > cardObjects.length){
						currentSet = 3;
					}
				}else{
					$(event.target).css({'opacity':'0.5'})
				}
			break;
		}
		
		$.each($(".sidebarNavButton"), function() {
     		if($(this).attr('data-id') == currentSet){
				$(this).css({'background':'#000', '-moz-border-radius':'2px', 'border-radius':'2px', 'width':'16px', 'height':'16px', 'margin':'-3px 5px 0 5px'});
			}
   		});

	
		// select the required cards
		var visibleCards = cardObjects.slice((currentSet*3)-3, currentSet*3);
		
		// show all the required cards
		for (var i = 0; i < visibleCards.length; i++) {
			visibleCards[i].fadeIn(200);
		}
		
		console.log(currentSet);
	}
	
	function cancelModal(){
		closeModal();
	}
	
	function checkModal(){
		$('#closeModalButton').show();
	}
	
	function closeModal(){
		$('#overlay').fadeOut(200);
		$('#createModal').fadeOut(200).delay(400);
		
		$("#" + currentButton).removeClass('selected');
		$('#arrangeButton').addClass('selected');
		currentButton = "arrangeButton";	
		
		$('#titleInput').val($('#titleFormInput').val());
		$('#objectiveInput').val($('#objectiveFormInput').val());
	}
});
