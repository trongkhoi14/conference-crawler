import re
from bs4 import BeautifulSoup
import spacy
nlp = spacy.load("xx_ent_wiki_sm") 
import xx_ent_wiki_sm
nlp = xx_ent_wiki_sm.load()
# Text with nlp
# doc = nlp('<div class="entry-content mb-5"><p>Venue: Queen Margaret University, Musselburgh </em></p>')
text = 'on Mobile Systems, Applications, and Services. ACM MobiSys 2024 seeks to present innovative and significant research on the design, implementation, usage, and evaluation of mobile computing and wireless systems, applications, and services. This conference builds on the success of the previous nineteen ACM MobiSys conferences. It is sponsored by ACM SIGMOBILE. <strong>Location: Toranomon Hills, Minato City</strong></p>'
# doc = nlp('<h2>INFOCOMP 2023</h2><h3>June 26, 2023 to June 30, 2023 - Nice, Saint-Laurent-du-Var,   France</h3></div></div><div class="contents">')

clean_text = BeautifulSoup(text, "html.parser").get_text(separator=" ")

# Remove extra spaces
clean_text = re.sub(r'\s+', ' ', clean_text)

# Remove words containing digits
clean_text = re.sub(r'\b\w*\d\w*\b', '', clean_text)

print(clean_text)
doc = nlp(clean_text)
# Display Entities
print([(w.text, w.label_) for w in doc.ents])

locations = [ent.text for ent in doc.ents if ent.label_ in ["LOC", "GPE", "ORG"] ]
print("Các địa điểm trong văn bản là:")
for location in locations:
    print(location)