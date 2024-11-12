"""Custom build script for hatch backend"""
import os
from pathlib import Path
import subprocess
import sys
try:
    from urllib.request import urlopen
except ImportError:
    from urllib import urlopen

HERE = Path(__file__).parent.resolve()
LIB = os.path.join(HERE, 'lc_notebook_diff', 'nbextension')
from hatchling.builders.hooks.plugin.interface import BuildHookInterface

def build_nbextension():
    # Execute the node build script
    subprocess.check_call(['npm', 'run', 'build'], cwd=LIB)

class CustomHook(BuildHookInterface):
    """A custom build hook."""
    PLUGIN_NAME = "custom"

    def initialize(self, version, build_data):
        """Initialize the hook."""
        if self.target_name not in ["sdist"]:
            return
        build_nbextension()