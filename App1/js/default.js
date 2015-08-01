// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=329104
(function () {
    //"use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };
    // ----------- Code above is stock WP code -------------------------------

    // Declaring our AngularJS module
    var angApp = angular.module('WinApp', ["ngSanitize"]);

    // This adds 'ng-enter' for catching pressing the enter button while in text-input
    angApp.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    });

    // Splits multiline text to an array of lines
    angApp.filter('newlines', function () {  
        return function (text) {
            return text.split(/\n/g);
        };
    });

    // Data provider for the notes
    angApp.service('Notes', function () {
        var ID = 0;
        this.notes;
        this.query = function () {
            if (localStorage[ID]) this.notes = JSON.parse(localStorage[ID]);
            else this.notes = [{ text: "An example note", }];
            return 0;
        };
        this.set = function (notesIncoming) {
            this.notes = notesIncoming;
            localStorage[ID] = JSON.stringify(this.notes);
            return 0;
        };

        this.workingID = function (id) {
            ID = id;
            return 0;
        };
        this.getID = function () {
            return ID;
        };
    });

    // This controller serves the notes of a designated folder
    angApp.controller('AppController', function ($scope, Notes, $rootScope) {
        this.lastDeletedPost = {};  // Holds the last deleted note in case it was a mishap
        $scope.notes = Notes.notes; // The Notes service provides the notes
        $scope.currentlySelected = "no"; // Used when editing a existing note

        // View is switched, data must be updated (todo: get data from service not from controller)
        $scope.$on("viewSwitch", function (event, newNotes) {
            $scope.notes = newNotes;
        });

        // Going back to main menu, if folder is empty the Overview is asked to delete it
        $scope.$on("goingToMainMenu", function (event, newNotes) {
            if (!$scope.notes.length) {
                $rootScope.$broadcast("deleteCurrentFolder", 0);
            }
        });
      
        $scope.addPost = function (intext) {
            if ($scope.currentlySelected != "no")
            {
                $scope.notes[$scope.currentlySelected].text = intext;
                $scope.currentlySelected = "no";
            }
            else
            {
                $scope.notes.push({ text: intext});
            }
                $scope.newText = "";
                Notes.set($scope.notes);
            };

        $scope.deletePost = function (index) {
            $scope.lastDeletedPost = $scope.notes[index]; // Save to temp in case of mishap
            $scope.notes.splice(index, 1);  // delete one item at current index
            Notes.set($scope.notes);
            $scope.currentlySelected = "no";
        };

        $scope.restorePost = function () {
            $scope.notes.push($scope.lastDeletedPost);
            Notes.set($scope.notes);
            $scope.lastDeletedPost = "";
            $scope.currentlySelected = "no";
        };

        $scope.editNote = function (noteText, index) {
            if ($scope.currentlySelected == "no") {
                $scope.newText = noteText;   // set the textinput text 
                $("#textinput").focus();     // give the textinput focus to bring up the keyboard
                $scope.currentlySelected = index;
            }
            else {
                $scope.currentlySelected = "no";
            }
        };

        $("#textinput").focusout(function () { // is thrown when focus is lost
            // Not in use anymore, but a nice snippet of code for future use
          })
    });

    // This controller serves the list of folders aka. the main menu
    angApp.controller('OverviewController', function ($scope, Notes, $rootScope) {
        // Init the values and persisted storage
        $scope.addingInProgress = false;
        $scope.showingOverview = true;
        if (!localStorage['storyCounter']) localStorage['storyCounter'] = 1; // Stores the ID of each folder, default is 1
        if (localStorage['storylist']) $scope.storylist = JSON.parse(localStorage['storylist']); // load from memory only if it exists
        else $scope.storylist = [{ name: "An example note", id: localStorage['storyCounter'] }];

        // Fires when a user clicks a folder to view the content
        $scope.goToStory = function (index) {
            $scope.showingOverview = false;
            Notes.workingID(index);
            Notes.query();
            $rootScope.$broadcast("viewSwitch", Notes.notes); // Alert the next controller that the data has changed
        };

        // Fires when a user asks to go back to the main menu
        $scope.goToMain = function () {
            $scope.showingOverview = true;
            $rootScope.$broadcast("goingToMainMenu", Notes.notes);
        };

        // If a user goes back to the main menu while the folder is empty
        // the folder should be deleted
        $scope.$on("deleteCurrentFolder", function (event, newNotes) {
            for (i = 0; i < $scope.storylist.length; i++) {
                if ($scope.storylist[i].id == Notes.getID()) {  // loop until the right ID is found
                    $scope.storylist.splice(i, 1);              // delete the folder
                    localStorage['storylist'] = JSON.stringify($scope.storylist); // update the persisted storage
                    break;
                }
            }
        });

        // 'Add folder' button is pressed
        $scope.addFolder = function (foldername) {
            if ($scope.addingInProgress) {
                if (foldername != null) {
                    localStorage['storyCounter'] += 1;
                    $scope.storylist.push({ name: foldername, id: localStorage['storyCounter'] });
                    localStorage['storylist'] = JSON.stringify($scope.storylist);
                    $scope.newFolderName = ""; // reset the text-input
                }
                $scope.addingInProgress = false;
            }
            else {
                $scope.addingInProgress = true;
            }
        };
    });

    // ----------- Code below is stock WP code -------------------------------
    app.start();
})();
