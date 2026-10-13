import importlib.util
import io
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    "publish", Path(__file__).resolve().parents[1] / "scripts/selectel-ci-publish.py"
)
publish = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publish)


class Client:
    def __init__(self, fail=False):
        self.files = {}
        self.fail = fail

    def put_object(self, **kw):
        if self.fail and kw["Key"] == "index.html":
            raise RuntimeError("injected upload failure")
        self.files[kw["Key"]] = (kw["Body"].read(), kw)

    def get_object(self, **kw):
        return {"Body": io.BytesIO(self.files[kw["Key"]][0])}


class PublishTests(unittest.TestCase):
    def test_headers_and_marker_are_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "build-id.txt").write_text("rev\n")
            (root / "index.html").write_text("<html>ok</html>")
            (root / "assets").mkdir()
            (root / "assets/a.js").write_text("js")
            client = Client()
            self.assertEqual(publish.publish(client, root, "docs", "rev"), 3)
            self.assertEqual(
                client.files["index.html"][1]["ContentType"], "text/html; charset=utf-8"
            )
            self.assertEqual(client.files["index.html"][1]["CacheControl"], "no-cache")
            self.assertEqual(
                client.files["assets/a.js"][1]["CacheControl"],
                "public, max-age=31536000, immutable",
            )
            self.assertNotIn("ACL", client.files["index.html"][1])

    def test_failed_upload_never_publishes_success_marker(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "build-id.txt").write_text("rev")
            (root / "index.html").write_text("html")
            client = Client(fail=True)
            with self.assertRaises(RuntimeError):
                publish.publish(client, root, "docs", "rev")
            self.assertNotIn("build-id.txt", client.files)


if __name__ == "__main__":
    unittest.main()
