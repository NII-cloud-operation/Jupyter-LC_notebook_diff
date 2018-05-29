# nbextension
def _jupyter_nbextension_paths():
    return [dict(
        section="tree",
        src="nbextension",
        dest="notebook_diff",
        require="notebook_diff/main")]
