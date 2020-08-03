/**
 * empty the body of the main table, for loading in fresh data
 */
function clearMainTable(){
    $('#naughtylist-body').empty();
}

/**
 * set the UI state to indicate loading
 */
function setLoading(){
    $('#naughtylist').hide();
    $('#loadingblock').show();
}

/**
 * set the UI state to indicate normal usage
 */
function clearLoading(){
    $('#naughtylist').show();
    $('#loadingblock').hide();
}

/**
 * initial creation of a table row. This only populates the first (projectid) column, with placeholder text everywhere else.
 * The other columns are filled in by `loadProjectDetails`
 * @param projectId
 * @returns {*|jQuery|HTMLElement}
 */
function createDataRow(projectId){
    var row = $('<tr>');

    $('<a>', {href: "/project/"+projectId,target: "_blank"}).text(projectId)
        .appendTo($('<td>', {class: "naughtylist-projectid"}).appendTo(row));
    for(var n=0;n<5;++n) {
        /*add holding text for other columns, they get ajax'd in later*/
        $('<td>').text("loading").appendTo(row);
    }
    return row;
}

/**
 * Looks up the given user id to translate it into a username.  Trys a cache in the local browser storage first,
 * if not then it makes an ajax call to the server to find it.
 * @param uid user id number to look up
 * @returns {Promise<Object>} a Promise that will resolve to a function called with (uid, username, otherdata) or
 * reject with a dictionary describing the error if user can't be looked up
 */
function lookupUserId(uid){
    return new Promise(function(resolve, reject) {
        var cachedUserData = localStorage.getItem("portal-user-" + uid);
        if (cachedUserData) {
            console.log("Local cache hit for user id " + uid);
            resolve(JSON.parse(cachedUserData));
        } else {
            console.log("Local cache miss for user id " + uid + ", looking up from server");
            $.ajax('/project/api/owner/' + uid)
                .done(function (data, textStatus, jqXHR){
                    data.uid = uid;
                    localStorage.setItem("portal-user-" + uid, JSON.stringify(data));
                    resolve(data)
                })
                .fail(function(jqXHR,textStatus, errorThrown){
                    console.error(textStatus);
                    try {
                        var responseJson = JSON.parse(jqXHR.responseText);
                        reject(responseJson)
                    } catch(e) {
                        console.error("Could not parse server response", jqXHR.responseText);
                        reject({detail: jqXHR.responseText, error: "Parse error", status: "error"});
                    }
                })
        }
    });
}

/**
 * Goes through any user id references in the project data, removes duplicates and translates them into usernames
 * @param projectData project data as returned from /project/{projectid}/api
 * @returns {Promise<Array<Object>>} - a Promise containing a list of results from `lookupUserId`
 */
function lookupUserIds(projectData) {
    var idList = projectData.gnm_project_username ? [projectData.user].concat(projectData.gnm_project_username) : [projectData.user];

    var filteredIdList = idList.filter(function(value, index, self){ return self.indexOf(value) === index });

    return Promise.all(filteredIdList.map(function(uid){ return lookupUserId(uid) }));
}

/**
 * Initiate an ajax request for the rest of the project details
 * @param projectId project ID to query
 * @param uiDataRow the table data row to update
 */
function loadProjectDetails(projectId, uiDataRow) {
    $.ajax("/project/" + projectId + "/api")
        .done(function(data, textStatus, jqXHR){
            uiDataRow.find('td:eq(1)').text(data.gnm_project_status);
            console.log("username list", data.gnm_project_username);

            //Promise.all([lookupUserId(data.user)].concat(data.gnm_project_username.map(function(uid){ return lookupUserId(uid) })))
            lookupUserIds(data)
                .then(function(userdataArray){
                    console.log("got", userdataArray);
                    //console.log("lookupUserId resolved", userdataArray[0]);
                    var containingList = $('<ul>',{"class": "user-list"});
                    userdataArray.map(function(item){ $('<li>', {"class": "user-entry"}).text(item.user_name).appendTo(containingList)});
                    uiDataRow.find('td:eq(2)').empty().append(containingList);
                })
                .catch(function(error){
                    console.error("Could not look up user id " + data.user, error);
                    uiDataRow.find('td:eq(2)').text(data.user);
                });

            uiDataRow.find('td:eq(3)').text(data.gnm_project_headline);
            uiDataRow.find('td:eq(4)').text(data.created);
            uiDataRow.find('td:eq(5)').text(data.updated);
        })
        .fail(function(jqXHR, textStatus, errorThrown){
            console.error(textStatus);
            console.error(jqXHR.responseText);
        })
}

/**
 * Main function to get more data to fill the main table
 */
function updateMainTable(){
    setLoading();
    var since = $('#start-search-date').val();
    var until = $('#end-search-date').val();
    $.ajax("/deliverables/api/missing?since=" + since + "&until=" + until)
        .done(function(data, textStatus, jqXHR){
            $.each(data.projects, function(idx, ptr){
                var datarow = createDataRow(ptr).appendTo($('#naughtylist-body'));
                loadProjectDetails(ptr, datarow);
            });
            if(data.limited){
                $('#limitedtext').text("Your search returned " + data.total + " results, limiting to the first " + data.projects.length + ".");
                $('#limitedblock').show();
            } else {
                $('#limitedblock').hide();
            }
            clearLoading();
        })
        .fail(function(jqXHR, textStatus, errorThrown){
            console.error(textStatus);
            console.error(jqXHR.responseText);
            clearLoading();
        })
}

/**
 * Prep widgets on page load and load in some data immediately
 */
$(document).ready(function() {
    $('#limitedblock').hide();
    $('#updateMainTable').on("click", function(evt){
        evt.preventDefault();
        clearMainTable();
        updateMainTable();
    });

    $('#start-search-date').datepicker({
        dateFormat: "yy-mm-dd",
        defaultDate: -30
    });
    $('#end-search-date').datepicker({
        dateFormat: "yy-mm-dd",
        defaultDate: 0
    });
    console.log("Document ready, loading");
    clearMainTable();
    updateMainTable();
});