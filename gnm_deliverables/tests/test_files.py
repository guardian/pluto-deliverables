import errno

from django.test import TestCase
from mock import MagicMock, patch


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


class TestCreateFolder(TestCase):
    def test_create_normal(self):
        """
        create_folder should attempt to create the given folder, set permissions and return the folder path with True
        if it was created
        :return:
        """
        with patch("os.makedirs") as mock_makedirs:
            with patch("os.chmod") as mock_chmod:
                import gnm_deliverables.files
                result = gnm_deliverables.files.create_folder("/tmp/some/path", permission=755)
                mock_makedirs.assert_called_once_with("/tmp/some/path")
                mock_chmod.assert_called_once_with("/tmp/some/path", 755)
                self.assertEqual(result, ("/tmp/some/path", True))

    def test_create_exists(self):
        """
        create_folder should not set permissions and return the folder path with False if the folder already exists
        :return:
        """
        exc = OSError()
        exc.errno = errno.EEXIST
        with patch("os.makedirs", side_effect=exc) as mock_makedirs:
            with patch("os.chmod") as mock_chmod:
                import gnm_deliverables.files
                result = gnm_deliverables.files.create_folder("/tmp/some/path", permission=755)
                mock_makedirs.assert_called_once_with("/tmp/some/path")
                mock_chmod.assert_not_called()
                self.assertEqual(result, ("/tmp/some/path", False))

    def test_create_error(self):
        """
        create_folder should pass any exceptions that occur other than EEXISTS up the chain
        :return:
        """
        exc = OSError()
        exc.errno = errno.EPERM
        with patch("os.makedirs", side_effect=exc) as mock_makedirs:
            with patch("os.chmod") as mock_chmod:
                import gnm_deliverables.files
                with self.assertRaises(OSError):
                    result = gnm_deliverables.files.create_folder("/tmp/some/path", permission=755)
                mock_makedirs.assert_called_once_with("/tmp/some/path")
                mock_chmod.assert_not_called()
