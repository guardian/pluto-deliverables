from django.core.management.base import BaseCommand
from gnm_deliverables.models import YouTubeCategories, Youtube, YouTubeChannels
import requests
import os
import logging
import urllib.parse

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Management command that will get data from YouTube
    """
    help = "Get data from YouTube"

    def handle(self, *args, **options):
        response = requests.get('https://www.googleapis.com/youtube/v3/videoCategories?regionCode=uk&key={0}'.format(urllib.parse.quote(os.environ['YOUTUBE_KEY'])))
        youtube_json_data = response.json()

        for item in youtube_json_data['items']:
            logger.info("Category: {0}".format(item['snippet']['title']))
            try:
                category = YouTubeCategories.objects.get(identity=item['id'])
                if category.title == item['snippet']['title']:
                    logger.info('Record exists for this category. Title has not changed. Nothing to do.')
                else:
                    logger.info('Updating record title.')
                    category.title = item['snippet']['title']
                    category.save()
            except YouTubeCategories.DoesNotExist:
                logger.info('Found a new category. Creating a new record for it.')
                new_record = YouTubeCategories(title=item['snippet']['title'], identity=item['id'])
                new_record.save()

        youtube_channels = Youtube.objects.order_by().values_list('youtube_channel').distinct()

        for channel in youtube_channels.iterator():
            logger.info('Channel id.: {0}'.format(channel[0]))
            channel_response = requests.get('https://www.googleapis.com/youtube/v3/channels?part=snippet&id={0}&key={1}'.format(channel[0], urllib.parse.quote(os.environ['YOUTUBE_KEY'])))
            youtube_channel_json_data = channel_response.json()

            try:
                channel_record = YouTubeChannels.objects.get(identity=channel[0])
                if channel_record.title == youtube_channel_json_data['items'][0]['snippet']['title']:
                    logger.info('Record exists for this channel. Title has not changed. Nothing to do.')
                else:
                    logger.info('Updating channel title.')
                    channel_record.title = youtube_channel_json_data['items'][0]['snippet']['title']
                    channel_record.save()
            except YouTubeChannels.DoesNotExist:
                logger.info('Found a new channel. Creating a new record for it.')
                new_channel_record = YouTubeChannels(title=youtube_channel_json_data['items'][0]['snippet']['title'], identity=channel[0])
                new_channel_record.save()
