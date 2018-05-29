#!/usr/bin/env python

from setuptools import setup, find_packages
import os
import sys
import shutil

HERE = os.path.abspath(os.path.dirname(__file__))
BASE = os.path.join(HERE, 'nbextension')
VERSION_NS = {}
with open(os.path.join(BASE, 'lc_notebook_diff', '_version.py')) as f:
    exec(f.read(), {}, VERSION_NS)

for ext in ['.css', '.js']:
    shutil.copy(os.path.join(HERE, 'html', 'jupyter-notebook-diff' + ext),
                os.path.join(BASE, 'lc_notebook_diff', 'nbextension'))

setup_args = dict (name='lc-notebook-diff',
      version=VERSION_NS['__version__'],
      description='LC notebook diff extension',
      packages=['lc_notebook_diff'],
      package_dir={'lc_notebook_diff': 'nbextension/lc_notebook_diff'},
      include_package_data=True,
      platforms=['Jupyter Notebook 4.2.x', 'Jupyter Notebook 5.x'],
      zip_safe=False,
      install_requires=[
          'notebook>=4.2.0',
      ]
)

if __name__ == '__main__':
    setup(**setup_args)
