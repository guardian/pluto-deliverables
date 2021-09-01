from django.test import TestCase


class TestSanitiseDirName(TestCase):
    def test_sanitise_normal(self):
        """
        sanitise_dir_name should pass a normal string unchanged
        :return:
        """
        import gnm_deliverables.files
        test_str = "this is a normal name"
        self.assertEqual(test_str, gnm_deliverables.files.sanitise_dir_name(test_str))

    def test_sanitise_dodgy(self):
        """
        sanitise dir_name should skip dodgy chars
        :return:
        """
        import gnm_deliverables.files
        test_str = "this is intended to \"break\" things; mkdir /path/to/something; chmod 777 /path/to/something; echo p0wned!"
        self.assertEqual("this is intended to break things mkdir pathtosomething chmod 777 pathtosomething echo p0wned",
                         gnm_deliverables.files.sanitise_dir_name(test_str))
