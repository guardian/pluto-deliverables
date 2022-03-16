from django.test import TestCase


class TestCDSResponderProcessor(TestCase):
    def test_get_route_mapping(self):
        """
        Makes sure the correct strings are output by get_route_mapping
        :return:
        """
        from rabbitmq.CDSResponderProcessor import get_route_mapping

        mapping = get_route_mapping('MainstreamMedia.xml')
        self.assertEqual(mapping, 'mainstream')
        mapping = get_route_mapping('DailyMotion.xml')
        self.assertEqual(mapping, 'dailymotion')
