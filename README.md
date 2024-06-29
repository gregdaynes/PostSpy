PostSpy.dev
===========

PostSpy is a small, fast web application providing a gui for running http requests.


Features
--------


### File based workflows

Requests are JSONC files, which declare the request dta, organized into subfolders.

Configuration for PostSpy is done in package.json to not clutter up the project directory.

Request files stored in the host project are intended to be part of your git workflows, allowing for sharing and versioning with the application code.

PostSpy gui manages the files in the folder. Creating a new request in the ui, creates a new file on disk.
- You can also manually create the file, and it will appear in postspy.


### Web GUI

Locally run PostSpy runs a small fastify webserver.

The UI is HTML + CSS with dashes of javascript where required.

The UI does not need to be a SPA


### Request Inspector

PostSpy is also an endpoint inspector. Send a request to the inspector endpoint and it will display information recevied. No more sending test json to a random site on the internet to inspect.


Installation
------------

Add the package to your project

```sh
# TODO
npm install --save-dev postspy
```

Initialize with configuration

```sh
# TODO
npx postspy init
```

