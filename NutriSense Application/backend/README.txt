-Before getting started you need to ensure you are on Python version 3.12.9 and your PyCharm interpreter is version 3.12-

Once you are on the correct versions. You can start ahead!

How to run :

---Run all of these commands in the command prompt by searching "cmd" in the windows search bar---

Step 1 : Download GIT-LFS.
			  
(Most likely you will face error when trying to install GIT-LFS through cmd; if so just search git-lfs 
 in the browser and download through the first link)  

# For Windows (using Chocolatey):
choco install git-lfs

# For macOS:
brew install git-lfs

# For Ubuntu/Debian:
sudo apt-get install git-lfs


Step 2 : Clone the repository and get relevant large files

# Initialize Git LFS
git lfs install

# Clone your repository
git clone https://github.com/AzraSaf/NutriSense.git

# Navigate to repository path
cd NutriSense

# Pull LFS files
git lfs pull

Step 3 : Set up Python virtual environment and download dependencies

# Navigate to the backend folder
cd NutriSense Application/backend

# Create a virtual environment with Python 3.12
python -m venv venv

# Activate the virtual environment

# For Windows:
.\venv\Scripts\activate

# For macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

--This next step is only necessary if your interpreter is showing errors or app.py fails to run--

Step 4 : Set up PyCharm (RECOMMENDED PYCHARM INTREPRETER TO BE IN VERSION 3.12) 

i. Open PyCharm

ii. Go to File → Open and select the backend folder inside NutriSense Application folder 

iii. Once opened, go to File → Settings (Windows/Linux) or PyCharm → Preferences (macOS)

iv. Navigate to Project: NutriSense → Python Interpreter

v. Click the dropdown in Python Intrepreter and click Show All

vi. Remove the current Intrepreter if it shows as invalid

vi. Select the "+" Option , and then click Add Local Intrepreter

vii. Then Select Enviroment:  Existing

viii. Browse to your project's virtual environment (Usually default is correct):
	Windows: backend\NutriSense Application\venv\Scripts\python.exe
	macOS/Linux: backend/NutriSense Application/venv/bin/python

vii. Click OK to apply the settings

Step 5 : Run the app.py and you are good to go!

The backend should now be running all okay! You can now proceed to the front end and open it preferrably in visual studio code using the Live Extension Plugin.




