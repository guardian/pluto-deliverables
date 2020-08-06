function validate_length(field, min, max, text) {
    if (field.parent().find('.validation_error').length == 0) {
        var error_container = field.parent().prepend('<span class="validation_error">Minimum one tag</span>');
    }
    var error_container = field.parent().find('.validation_error');

    if(min !== null && field.val().length < min) {
        if(text !== undefined) {
            error_container.text(text);
        } else {
            error_container.text('Minimum length ' + min);
        }
        error_container.show();
        return false;
    } else {
        error_container.hide();
    }

    if(max !== null && field.val().length > max) {
        if(text !== undefined) {
            error_container.text(text);
        } else {
            error_container.text('Maximum length ' + max);
        }
        error_container.show();
        return false;
    } else {
        error_container.hide();
    }

    return true;
}

function validate_words(field, min) {
    var error_container = field.parent().find('.validation_error');

    if(field.val().split(' ').length < min) {
        error_container.text('Minimum length ' + min + ' words');
        error_container.show();
        return false;
    } else {
        error_container.hide();
    }

    return true;
}

function validate_dates(field1, field2, text1, text2) {
    var val1 = field1.val();
    var val2 = field2.val();

    var error_container1 = field1.parent().find('.validation_error');
    var error_container2 = field2.parent().find('.validation_error');

    if (val1.length == 0 || val2.length == 0) {
        error_container1.hide();
        error_container2.hide();
        return true;
    }

    var date1 = new Date(val1);
    var date2 = new Date(val2);

    if(date1 > date2) {
        error_container1.text(text1);
        error_container1.show();
        error_container2.text(text2);
        error_container2.show();
        return false;
    } else {
        error_container1.hide();
        error_container2.hide();
    }
    return true;
}

function validate_tags(field) {
    if (field.parent().find('.validation_error').length == 0) {
        var error_container = field.parent().prepend('<span class="validation_error">Minimum one tag</span>');
    }
    var error_container = field.parent().find('.validation_error');

    if(!field.val()) {
        error_container.show();
        return false;
    } else {
        error_container.hide();
    }
    return true;
}

function validate_dropdown(field) {
    if (field.parent().find('.validation_error').length == 0) {
        var error_container = field.parent().prepend('<span class="validation_error">Minimum one tag</span>');
    }
    var error_container = field.parent().find('.validation_error');

    if(!field.val() || (field.val() == '----') || (field.val() == '')) {
        error_container.show();
        return false;
    } else {
        error_container.hide();
    }
    return true;
}

function validate_fields(tab) {
    var ret = true;

    if (tab == 'general') {
        ret &= validate_tags($('#id_gnm_asset_keywords'));
        ret &= validate_length($('#id_gnm_master_website_headline'), 1, 300);
        ret &= validate_length($('#id_gnm_master_generic_titleid'), 1, null);
        //ret &= validate_length($('#id_gnm_master_generic_holdingimage_16x9'), 1, null, 'Holding image must be set');
        ret &= validate_words($('#id_gnm_master_website_standfirst'), 0);
    } else if (tab == 'interactive') {
        // No fields are required.
    } else if (tab == 'youtube') {
        ret &= validate_length($('#id_gnm_master_youtube_title'), 1, 300);
        ret &= validate_tags($('#id_gnm_master_youtube_keywords'));
        ret &= validate_dropdown($('#id_gnm_master_youtube_category'));
        ret &= validate_dropdown($('#id_gnm_master_youtube_channelid'));
    } else if (tab == 'dailymotion') {
        ret &= validate_length($('#id_gnm_master_dailymotion_title'), 1, 300);
        ret &= validate_tags($('#id_gnm_master_dailymotion_keywords'));
        ret &= validate_dropdown($('#id_gnm_master_dailymotion_dailymotioncategory'));
    } else if (tab == 'syndication') {
        ret &= validate_length($('#id_gnm_master_mainstreamsyndication_title'), 1, 300);
        ret &= validate_tags($('#id_gnm_master_mainstreamsyndication_keywords'));
    }
    return ret;
}

function refresh_upload_logs() {
    /* master_get_upload_logs is defined in the main template */
    $.ajax(master_get_upload_logs, {
        success: function(data) {
            $('#id_gnm_master_website_uploadlog').val(data.website_upload_log);
            $('#id_gnm_master_interactive_uploadlog').val(data.interactive_upload_log);
            $('#id_gnm_master_youtube_uploadlog').val(data.youtube_upload_log);
            $('#id_gnm_master_dailymotion_uploadlog').val(data.dailymotion_upload_log);
            $('#id_gnm_master_mainstreamsyndication_uploadlog').val(data.mainstreamsyndication_upload_log);
            if(data.r2_url != null) {
                if($('.r2-url').prop('nodeName')!='A'){ //only show a notification if the href has not been set yet.
                    var callbacks = {
                        'onclick': function(){
                            window.open(data.r2_url,'_blank');
                        }
                    };
                    localNotifications.post("Composer page ready",data.r2_url,data.r2_url,callbacks);
                }
                var r2 = '<label>Composer URL</label><a href="' + data.r2_url + '" class="r2-url">' + data.r2_url + '</a>';
                $('.r2-url').parent().html(r2);
            }
        }
    });
}

function update_upload_button(statusbutton) {
    var uploadstatus = statusbutton.siblings('.edit-select-wrapper').find('select');
    if(uploadstatus.val() == 'Ready to Upload') {
        statusbutton.closest('li').removeClass('with-button');
        statusbutton.hide();
    }
    else {
        statusbutton.closest('li').addClass('with-button');
        statusbutton.show();
    }
}

function setup_publish_buttons(){
    //TODO: Change this to be more readable
    $('.upload_status_update').siblings('.edit-select-wrapper').find('select').change( function(){
        update_upload_button($(this).parent().siblings('.upload_status_update'));
    });

    $('.upload_status_update').each( function(){
        update_upload_button($(this));
    });
}

function setup_publish_buttons_action(){
    $('.upload_status_update').click(function(e) {
        e.preventDefault();
        var tab = $(this).closest('.tab').attr('id');
        if(validate_fields(tab) == 0) { return; }

        var button = $(this);
        button.hide();
        console.log("showing spinner");
        button.next('.spinner').show();
        console.log(button.next('.spinner'));
        console.log(button.next('.spinner').is(":visible"));
        var $t = $(this);

        var url;
        if($t.attr("data-uploadtype")){
            var uploadtype_selector = $('#' + $t.attr("data-uploadtype"));
            url = $t.attr("href") + "?type=" + uploadtype_selector.val();
        } else {
            url = $t.attr("href");
        }

        target = $('#' + $t.attr("data-target"));
        target.val("Ready to Upload");

        /* this function carries out the update */
        $.ajax(url, {
            type:'POST',
            data: {status: target.val()},
            success: function(data) {
                button.next('.spinner').hide();
                button.hide();
                update_upload_button(button);
                button.parent().parent().find('.refresh_upload_logs_button').trigger('click');
                $('.localerror').hide();
            },
            error: function(jqxhr, textstatus, errorThrown){
                button.next('.spinner').hide();
                button.show();
                $t.text('Failed to publish');
                setTimeout(function() {
                    $t.text('Publish');
                }, 3000);

                var errorEntry = $('<div>',{'class': 'localerror'});

                try {
                    var servererror = $.parseJSON(jqxhr.responseText);
                    errorEntry.text(servererror.detail);
                } catch(e){
                    errorEntry.text(errorThrown);
                }

                $t.parent().append(errorEntry);
                errorEntry.show();
            }
        });
    });
}
