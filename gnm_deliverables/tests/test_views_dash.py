from django.test import TestCase
from dateutil.parser import parse
import json
from numpy import array

class TestPublicationDatesSummary(TestCase):
    def test_invert_data(self):
        from gnm_deliverables.views.deliverables_dash_views import PublicationDatesSummary
        raw_content = {
            "platform1": [
                {
                    "day": parse("2020-04-14T00:00:00Z"),
                    "count": 2
                },
                {
                    "day": parse("2020-04-15T00:00:00Z"),
                    "count": 8
                },
                {
                    "day": parse("2020-04-16T00:00:00Z"),
                    "count": 5
                },
                {
                    "day": parse("2020-04-17T00:00:00Z"),
                    "count": 4
                }
            ],
            "platform2": [],
            "platform3": [
                {
                    "day": parse("2020-04-16T00:00:00Z"),
                    "count": 9
                },
            ]
        }

        result = PublicationDatesSummary.invert_data(raw_content, parse("2020-04-14T00:00:00Z"), parse("2020-04-17T00:00:00Z"))
        self.assertEqual(list(result["dates"]), ["2020-04-14T00:00:00+00:00","2020-04-15T00:00:00+00:00","2020-04-16T00:00:00+00:00","2020-04-17T00:00:00+00:00"])

        self.assertEqual(result["platforms"][0]["name"], "platform1")
        self.assertEqual(list(result["platforms"][0]["data"]), [2, 8, 5, 4])
        self.assertEqual(result["platforms"][1]["name"], "platform2")
        self.assertEqual(list(result["platforms"][1]["data"]), [0, 0, 0, 0])
        self.assertEqual(result["platforms"][2]["name"], "platform3")
        self.assertEqual(list(result["platforms"][2]["data"]), [0, 0, 9, 0])
