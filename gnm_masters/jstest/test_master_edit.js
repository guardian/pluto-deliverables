var should = require('should'),
    expect = require('expect'),
    assert = require('assert'),
    jsdom = require('jsdom');
var sinon = require('sinon');
var fs = require('fs');
const { Script } = require("vm");

var master_edit = fs.readFileSync(__dirname + '/../static/gnm_masters/js/master_edit.js');
var jquery = fs.readFileSync(__dirname + "/lib/jquery.js");

describe('master_edit javascript library', function(){
    describe('validation function', function(){
        it('should detect too few words and show error', function(){
            html = "<html><body><form>" +
                "<p class='validation_error'>no error</p>" +
                "<input id='test_input' value='some words'>" +
                "</form></body>";

            var doc = new jsdom.JSDOM(html, {runScripts: "dangerously"}),
                window = doc.window,
                $ = global.jQuery = require('jquery')(window);

            var master_edit_script = new Script(master_edit);
            doc.runVMScript(master_edit_script);

            window.validate_words($('#test_input'), 10);
            $('.validation_error').text().should.equal("Minimum length 10 words");
        });

        it('should show no error if there are enough words', function(){
            html = "<html><body><form>" +
                         "<p class='validation_error'>no error</p>" +
                         "<input id='test_input' value='a longer number of words that should definitely pass the test'>" +
                         "</form></body>";

            var doc = new jsdom.JSDOM(html, {runScripts: "dangerously"}),
                window = doc.window,
                $ = global.jQuery = require('jquery')(window);

            var master_edit_script = new Script(master_edit);
            doc.runVMScript(master_edit_script);

            window.validate_words($('#test_input'), 10);
            $('.validation_error').text().should.equal("no error");
        });

    });

    describe('upload setup', function() {
        var server;
        var html = "<html><body><div class='tab'><form>" +
                "<select id='id_upload_type_selector'><option name='first' value='first' selected></option><option name='second' value='second'></option></select>" +
            "<a href='/some/test/path' class='upload_status_update' data-uploadtype='id_upload_type_selector' id='testlink'>testlink</a>" +
            "<img class='spinner' style='display: none;' id='spinnerimg'>" +
            "</form></div></body>";

        beforeEach(function () {
            server = sinon.fakeServer.create();
        });

        afterEach(function () {
            server.restore();
        });

        it('should trigger an ajax request to link\'s href when specific link is clicked and update the ui', function(done){
            var data = {
                status: 'ok',
                detail: 'trigger output to /path/to/watchfolder',
                output_path: '/path/to/watchfolder/somefile.xml'
            };

            server.respondWith("GET", "/some/test/path", [
                200, {"Content-Type":"application/json"}, JSON.stringify(data)
            ]);


            var doc = new jsdom.JSDOM(html, {runScripts: "dangerously"}),
                window = doc.window,
                $ = global.jQuery = require('jquery')(window);
            $.fx.off = true;

            var master_edit_script = new Script(master_edit);
            doc.runVMScript(master_edit_script);

            var callback = sinon.spy();
            // Creating a deffered object
            var dfd = $.Deferred();

            // Stubbing the ajax method
            sinon.stub($, 'ajax').callsFake(function (url, options) {
                // assigns success callback to done.
                if(options.success) dfd.done([
                    function() { options.success(data)},
                    function(){
                        /*now that the success callback has been triggered, test that it had the right effects*/
                        assert(! $('#spinnerimg').is(":visible"));
                        //assert(! $('#testlink').is(":visible")); //can't test this at the moment, see master_edit.js line 171
                        done();
                    }
                    ]
                );

                // assigns error callback to fail.
                if(options.error) dfd.fail(options.error);
                dfd.success = dfd.done;
                dfd.error = dfd.fail;

                // returning the deferred object so that we can chain it.
                return dfd;
            });

            window.setup_publish_buttons_action();
            var spinner = $('#spinnerimg');
            assert(! spinner.is(":visible"));
            console.log(spinner);
            $('#testlink').trigger('click');
            spinner.finish();
            //assert(spinner.is(":visible"));

            server.respond();
            assert($.ajax.calledOnce);
            assert($.ajax.calledWith('/some/test/path?type=first'));

            dfd.resolve();
        });
    });

    /* this needs replacing with mocha-jsdom code, as the node-jsdom that it was referring to does not work on node >6.x */
    //
    // describe('upload setup', function() {
    //     var server;
    //     var html = "<html><body><div class='tab'><form>" +
    //             "<select id='id_upload_type_selector'><option name='first' value='first' selected></option><option name='second' value='second'></option></select>" +
    //         "<a href='/some/test/path' class='upload_status_update' data-uploadtype='id_upload_type_selector' id='testlink'>testlink</a>" +
    //         "<img class='spinner' style='display: none;' id='spinnerimg'>" +
    //         "</form></div></body>";
    //
    //     beforeEach(function () {
    //         server = sinon.fakeServer.create();
    //     });
    //
    //     afterEach(function () {
    //         server.restore();
    //     });
    //
    //
    //     it('should trigger an ajax request to link\'s href when specific link is clicked and update the ui', function(done){
    //         var data = {
    //             status: 'ok',
    //             detail: 'trigger output to /path/to/watchfolder',
    //             output_path: '/path/to/watchfolder/somefile.xml'
    //         };
    //
    //         server.respondWith("GET", "/some/test/path", [
    //             200, {"Content-Type":"application/json"}, JSON.stringify(data)
    //         ]);
    //
    //         jsdom.env({
    //             html: html,
    //             documentRoot: __dirname + "/lib",
    //             src: [
    //                 jquery.toString(),
    //                 master_edit.toString()
    //             ],
    //             done: function (error, window) {
    //                 if (error) {
    //                     console.error(error);
    //                     return;
    //                 }
    //                 var $ = window.jQuery;
    //
    //                 var callback = sinon.spy();
    //                 // Creating a deffered object
    //                 var dfd = $.Deferred();
    //
    //                 // Stubbing the ajax method
    //                 sinon.stub($, 'ajax').callsFake(function (url, options) {
    //                     // assigns success callback to done.
    //                     if(options.success) dfd.done([
    //                         function() { options.success(data)},
    //                         function(){
    //                             /*now that the success callback has been triggered, test that it had the right effects*/
    //                             assert(! $('#spinnerimg').is(":visible"));
    //                             //assert(! $('#testlink').is(":visible")); //can't test this at the moment, see master_edit.js line 171
    //                             done();
    //                         }
    //                         ]
    //                     );
    //
    //                     // assigns error callback to fail.
    //                     if(options.error) dfd.fail(options.error);
    //                     dfd.success = dfd.done;
    //                     dfd.error = dfd.fail;
    //
    //                     // returning the deferred object so that we can chain it.
    //                     return dfd;
    //                 });
    //
    //                 window.setup_publish_buttons_action();
    //                 assert(! $('#spinnerimg').is(":visible"));
    //                 $('#testlink').trigger('click');
    //                 assert($('#spinnerimg').is(":visible"));
    //
    //                 server.respond();
    //                 assert($.ajax.calledOnce);
    //                 assert($.ajax.calledWith('/some/test/path?type=first'));
    //
    //
    //                 dfd.resolve();
    //             }
    //         });
    //     });
    //
    //     it('should show an error in the ui if the ajax request fails', function(done){
    //         var data = {
    //             status: 'error',
    //             detail: 'a pretend error happened',
    //             trace: 'sometraceback\n\n\nwith newlines\n\n'
    //         };
    //
    //         server.respondWith("GET", "/some/test/path", [
    //             200, {"Content-Type":"application/json"}, JSON.stringify(data)
    //         ]);
    //
    //         jsdom.env({
    //             html: html,
    //             documentRoot: __dirname + "/lib",
    //             src: [
    //                 jquery.toString(),
    //                 master_edit.toString()
    //             ],
    //             done: function (error, window) {
    //                 if (error) {
    //                     console.error(error);
    //                     return;
    //                 }
    //                 var $ = window.jQuery;
    //
    //                 var callback = sinon.spy();
    //                 // Creating a deffered object
    //                 var dfd = $.Deferred();
    //
    //                 // Stubbing the ajax method
    //                 sinon.stub($, 'ajax').callsFake(function (url, options) {
    //                     console.log("$.ajax called with " + url);
    //                     // assigns success callback to done.
    //                     if(options.success) dfd.done(options.success(data));
    //
    //                     // assigns error callback to fail.
    //                     if(options.error) dfd.fail([
    //                         function(){ options.error({responseText: JSON.stringify(data)},"failed","test error") },
    //                         function(){
    //                             assert($('.localerror'));
    //                             assert($('.localerror').is(":visible"));
    //                             $('.localerror').text().should.equal("a pretend error happened");
    //                             done();
    //                         }
    //                         ]
    //                     );
    //                     dfd.success = dfd.done;
    //                     dfd.error = dfd.fail;
    //
    //                     // returning the deferred object so that we can chain it.
    //                     return dfd;
    //                 });
    //
    //                 window.setup_publish_buttons_action();
    //                 assert(! $('#spinnerimg').is(":visible"));
    //                 $('#testlink').trigger('click');
    //                 //assert($('#spinnerimg').is(":visible"));
    //
    //                 server.respond();
    //                 assert($.ajax.calledOnce);
    //                 assert($.ajax.calledWith('/some/test/path?type=first'));
    //
    //
    //                 dfd.reject();
    //             }
    //         });
    //     });
    //
    //     it('should handle an error that is not JSON by showing the browser error instead', function(done){
    //         var data = "something that is not json";
    //
    //         jsdom.env({
    //             html: html,
    //             documentRoot: __dirname + "/lib",
    //             src: [
    //                 jquery.toString(),
    //                 master_edit.toString()
    //             ],
    //             done: function (error, window) {
    //                 if (error) {
    //                     console.error(error);
    //                     return;
    //                 }
    //                 var $ = window.jQuery;
    //
    //                 var callback = sinon.spy();
    //                 // Creating a deffered object
    //                 var dfd = $.Deferred();
    //
    //                 // Stubbing the ajax method
    //                 sinon.stub($, 'ajax').callsFake(function (url, options) {
    //                     // assigns success callback to done.
    //                     if(options.success) dfd.done(options.success(data));
    //
    //                     // assigns error callback to fail.
    //                     if(options.error) dfd.fail([
    //                             function(){ options.error({responseText: data},"failed","test error") },
    //                             function(){
    //                                 assert($('.localerror'));
    //                                 assert($('.localerror').is(":visible"));
    //                                 $('.localerror').text().should.equal("test error");
    //                                 done();
    //                             }
    //                         ]
    //                     );
    //                     dfd.success = dfd.done;
    //                     dfd.error = dfd.fail;
    //
    //                     // returning the deferred object so that we can chain it.
    //                     return dfd;
    //                 });
    //
    //                 window.setup_publish_buttons_action();
    //                 assert(! $('#spinnerimg').is(":visible"));
    //                 $('#testlink').trigger('click');
    //                 //assert($('#spinnerimg').is(":visible"));
    //
    //                 server.respond();
    //                 assert($.ajax.calledOnce);
    //                 assert($.ajax.calledWith('/some/test/path?type=first'));
    //
    //
    //                 dfd.reject();
    //             }
    //         });
    //     });
    // });
});
