# coding: utf-8
'''
Settings file where Master attributes with specific default values has their default values specified.

Remember:
    checkboxes are always groups of checkboxes, even if they just contain one value.
    unchecked ones are represented by that key not existing within the list, but there should still be an empty list when defaulting to false!

    e.g. metadata attribute "gnm_masters_youtube_allowcomments" has a checkbox with key "allow_comments".
    Set "gnm_masters_youtube_allowcomments" to True/checked
        MASTER_METADATA_DEFAULT_VALUES = {'gnm_masters_youtube_allowcomments': ['allow_comments']}
    Set "gnm_masters_youtube_allowcomments" to False/unchecked
        MASTER_METADATA_DEFAULT_VALUES = {'gnm_masters_youtube_allowcomments': []}
'''
from portal.plugins.gnm_vidispine_utils import constants as const

MASTER_METADATA_DEFAULT_VALUES = {
    const.GNM_MASTERS_YOUTUBE_ALLOWCOMMENTS: [const.GNM_MASTERS_YOUTUBE_ALLOWCOMMENTS_TRUE],
    const.GNM_MASTERS_YOUTUBE_ALLOWRESPONSES: [const.GNM_MASTERS_YOUTUBE_ALLOWRESPONSES_TRUE],
    const.GNM_MASTERS_YOUTUBE_ALLOWRATINGS: [const.GNM_MASTERS_YOUTUBE_ALLOWRATINGS_TRUE],
    const.GNM_MASTERS_YOUTUBE_ALLOWEMBEDDING: [const.GNM_MASTERS_YOUTUBE_ALLOWEMBEDDING_TRUE],
    const.GNM_MASTERS_YOUTUBE_EMBEDDABLE: [const.GNM_MASTERS_YOUTUBE_EMBEDDABLE_TRUE],
    const.GNM_MASTERS_YOUTUBE_NOTIFY_CHANNEL_SUBSCRIBERS: [const.GNM_MASTERS_YOUTUBE_NOTIFY_CHANNEL_SUBSCRIBERS_TRUE],
}
