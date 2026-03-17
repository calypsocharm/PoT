from setuptools import setup, find_packages

setup(
    name="botcash",
    version="1.0.0",
    description="The official SDK for the BotCash Sovereign L2 Network.",
    author="BotCash Core",
    packages=find_packages(),
    install_requires=[
        "requests",
        "cryptography"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: ISC License (ISCL)",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.7',
)
