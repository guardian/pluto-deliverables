from django.test import TestCase
import datetime


class TestVSNotificaiton(TestCase):
    raw_data = """{"field":[{"key":"totalSteps","value":"9"},{"key":"asset_id","value":"1"},{"key":"type","value":"ESSENCE_VERSION"},{"key":"currentStepNumber","value":"10"},{"key":"sourceUri","value":"file:///tmp/test/Live%20in%20Littlebourne_med.mp4"},{"key":"project_id","value":"12"},{"key":"noTranscode","value":"false"},{"key":"errorMessage-200-0-5","value":"/tmp/test/Live in Littlebourne_med.mp4 (No such file or directory)"},{"key":"action","value":"STOP"},{"key":"errorMessage-200-0-4","value":"/tmp/test/Live in Littlebourne_med.mp4 (No such file or directory)"},{"key":"errorMessage-200-0-3","value":"/tmp/test/Live in Littlebourne_med.mp4 (No such file or directory)"},{"key":"errorMessage-200-0-2","value":"/tmp/test/Live in Littlebourne_med.mp4 (No such file or directory)"},{"key":"errorMessage-200-0-1","value":"/tmp/test/Live in Littlebourne_med.mp4 (No such file or directory)"},{"key":"deleteFileOnFailure","value":"true"},{"key":"errorMessage-200-0-0","value":"/tmp/test/Live in Littlebourne_med.mp4 (No such file or directory)"},{"key":"bytesWritten","value":"0"},{"key":"sequenceNumber","value":"5"},{"key":"item","value":"VX-30"},{"key":"filePathMap","value":"VX-15=VX-15.mp4"},{"key":"currentStepStatus","value":"FINISHED"},{"key":"createThumbnails","value":"true"},{"key":"started","value":"2020-08-18T10:30:42.376Z"},{"key":"tags","value":"original"},{"key":"progress-200-0-0","value":"bytes 0"},{"key":"jobId","value":"VX-20"},{"key":"itemId","value":"VX-30"},{"key":"progress-200-0-1","value":"bytes 0"},{"key":"progress-200-0-2","value":"bytes 0"},{"key":"progress-200-0-3","value":"bytes 0"},{"key":"progress-200-0-4","value":"bytes 0"},{"key":"progress-200-0-5","value":"bytes 0"},{"key":"baseUri","value":"http://vidispine-server:8080/API/"},{"key":"import_source","value":"pluto-deliverables"},{"key":"user","value":"admin"},{"key":"originalFilename","value":"Live in Littlebourne_med.mp4"},{"key":"status","value":"FAILED_TOTAL"},{"key":"fileId","value":"VX-15"}]}"""

    def test_vs_notification(self):
        """
        VSNotification should parse content from the server and offer methods to read it
        :return:
        """
        from gnm_deliverables.vs_notification import VSNotification

        noti = VSNotification.from_bytes(self.raw_data.encode("UTF-8"))
        self.assertEqual(noti.status,"FAILED_TOTAL")
        self.assertEqual(noti.started.day, 18)
        self.assertEqual(noti.started.hour, 10)
        self.assertEqual(noti.project_id, 12)
        self.assertEqual(noti.import_source,"pluto-deliverables")
        self.assertEqual(noti.asset_id, 1)