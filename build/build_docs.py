import os
from os.path import join, getsize

os.system('npm install jsdoc-to-markdown')

for root, dirs, files in os.walk('./src'):
	for name in files:
		if name.endswith('.js'):
			dest = os.path.join('docs/', root)
			docname = os.path.join(dest, name.replace('.js', '.md'))
			try:
				os.makedirs(dest)
				break
			except OSError, e:
				if e.errno != 17:
					raise
				pass
			print(docname)
			os.system('jsdoc2md {0} > ./{1}'.format(os.path.join(root, name), docname))
