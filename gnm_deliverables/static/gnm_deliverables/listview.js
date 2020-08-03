/**
 * returns a jQuery DOM node containing a link to the project. This will be asynchronously updated to hold the project name,
 * if /project/{id}/api returns one.
 * @param project_id Vidispine project ID to link to
 * @returns {*|jQuery}
 */
var projectNameCache = {};

function projectLinkFor(project_id){
    const initialLabelText = projectNameCache.hasOwnProperty(project_id) ? projectNameCache[project_id] : project_id;
    
    const projectLink = $('<a>',{href: "/project/" + project_id}).text(initialLabelText);
    if(! projectNameCache.hasOwnProperty(project_id)) {
        $.ajax("/project/" + project_id + "/api")
            .done(function (data, textStatus, jqXHR) {
                projectNameCache[project_id] = data.gnm_project_headline;
                projectLink.text(data.gnm_project_headline)
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
            });
    }
    return projectLink;
}

function deliverableLinkFor(deliverable_id, deliverable_name){
    const deliverableLink = $('<a>',{href:"/deliverables/" + deliverable_id + "/"}).text(deliverable_name);
    return deliverableLink;
}

/**
 * shows a label indicating ingest status for the given delivery bundly
 * @param assetCount - number of assets in the bundle
 * @param ingestStatusId - ingest status as returned from the data model (0 or 1)
 * @returns {*|jQuery} - jQuery DOM node containing the label
 */
function showIngestStatus(assetCount, ingestStatusId) {
    if(assetCount===0) return $("<p>").text("No assets present");
    if(ingestStatusId===0)
        return $("<p>").text("Still ingesting...");
    else
        return $("<p>").text("All " + assetCount + " assets present")
}

/**
 * called from $(document).ready() in the main html, this kicks things off by initialising the data tables and causing the client
 * to download data from the server
 */
function setup_lists(elemsList) {
    for(var i=0;i<elemsList.length;++i) {
        $('table#' + elemsList[i].tabId).dataTable({
            "sAjaxSource": elemsList[i].dataSrc,
            // "bProcessing": true,
            "bServerSide": true,
            "bLengthChange": false,
            // "aoColumnDefs" : [{"bSortable" : false, "aTargets" : [ "no-sorting" ]}],
            "iDisplayLength": parseInt('15', 10),
            "sDom": '<"top"ifpl>rt<"bottom"><"clear">',
            "aaSorting": [[2, 'desc']],
            "oLanguage": {
                "sSearch": "",
                "sInfo": 'Showing _START_ to _END_ of _TOTAL_ deliverable bundles'
            },
            "fnRowCallback": function (nRow, aData, iDisplayIndex) {
                console.log("fnRowCallback: got ", nRow, aData, iDisplayIndex);
                nRow.className = nRow.className + " clickableRow";
                nRow.setAttribute("data-url", "/deliverables/" + aData[4]);

                nRow.addEventListener('click', function () {
                    window.document.location = $(this).data('url');
                });

                return $(nRow).empty()
                    .append($('<td>').append(deliverableLinkFor(aData[4],aData[5])))
                    .append($('<td>').append(projectLinkFor(aData[6])))
                    .append($('<td>').append(aData[2]))
                    .append($('<td>').append(aData[1]))
                    .append($('<td>').append(showIngestStatus(aData[1], aData[3])));
            }
        });
    }
}