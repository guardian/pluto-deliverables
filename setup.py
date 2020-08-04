#!/usr/bin/env python3

from distutils.core import setup
import os

version = os.environ.get("$CI_PIPELINE_IID")
if version is None:
    version = "DEV"

setup(
    name="pluto-deliverables",
    version=version,
    description="Media deliverables management",
    author="Codemill & Guardian News Media",
    author_email="multimediatech@theguardian.com",
    url="https://gitlab.com/codmill/customer-projects/guardian/pluto-deliverable",
    packages=['pluto-deliverables']
)