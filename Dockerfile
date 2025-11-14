FROM quay.io/jupyter/scipy-notebook:notebook-7.4.7

USER root

# Install Node.js 20.x (required for Etherpad build)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    mkdir -p /.npm && \
    chown jovyan:users -R /.npm && \
    rm -rf /var/lib/apt/lists/*
ENV NPM_CONFIG_PREFIX=/.npm
ENV PATH=/.npm/bin/:${PATH}

RUN pip install --no-cache  jupyter_nbextensions_configurator

COPY . /tmp/notebook_diff
RUN pip install --no-cache /tmp/notebook_diff

RUN jupyter labextension enable lc_notebook_diff

RUN jupyter nbclassic-extension install --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-serverextension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension install --py lc_notebook_diff --sys-prefix && \
    jupyter nbclassic-extension enable --py lc_notebook_diff --sys-prefix && \
    fix-permissions /home/$NB_USER

USER $NB_USER

RUN cp -fr /tmp/notebook_diff/html /home/$NB_USER/
