/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

const _message = (type, msgcode, ctrycode=234, string1=null, string2=null, string3=null) => {
  
    let code, lang;
    if(ctrycode == 225) lang = "FR";
    else lang = "EN";

    const messagebank = {

      error: {
        1010: {
          EN: "Internal error, kindly contact website admin.",
          FR: "Erreur interne, veuillez contacter l'administrateur du site Web.",
        },
        1020: {
          EN: "Authentication Error!",
          FR: "Erreur d'authentification!",
        },
        1021: {
          EN: "Please login to access page.",
          FR: "Veuillez vous connecter pour accéder à cette page.",
        },
        1030: {
          EN: "",
          FR: "",
        },
        1040: {
          EN: "",
          FR: "",
        },
        1050: {
          EN: "Your opt-in request already submitted.",
          FR: "Votre demande d'adhésion a déjà été soumise.",
        },
        1060: {
          EN: "There's an error with your request, kindly contact website admin.",
          FR: "Il y a une erreur avec votre demande, veuillez contacter l'administrateur du site Web.",
        },
        1070: {
          EN: "There's an error in the Phone Number, kindly check again.",
          FR: "Il y a une erreur dans le numéro de téléphone, veuillez vérifier à nouveau.",
        },
        1080: {
          EN: "The phone number you provided does not match this request. Please check and try again.",
          FR: "Le numéro de téléphone que vous avez fourni ne correspond pas à cette demande. S'il vous plaît, vérifiez et essayez à nouveau.",
        },
        1090: {
          EN: "You did not opt in for this Group's messages or had already opted out.",
          FR: "Vous n'avez pas accepté les messages de ce groupe ou vous vous êtes déjà désabonné.",
        },
        1100: {
          EN: "",
          FR: "",
        },
        1110: {
          EN: "",
          FR: "",
        },
        1120: {
          EN: "",
          FR: "",
        },
        1130: {
          EN: "",
          FR: "",
        },
        1140: {
          EN: "",
          FR: "",
        },
        1150: {
          EN: "",
          FR: "",
        },
      },
      msg: {
        1010: {
          EN: "",
          FR: "",
        },
        1020: {
          EN: "You've been successfully logged out",
          FR: "Vous avez été déconnecté avec succès",
        },
        1030: {
          EN: "",
          FR: "",
        },
        1040: {
          EN: "",
          FR: "",
        },
        1050: {
          EN: "Hello " + string1 + ", thanks for opting in to our WhatsApp platform. One last thing, please use this link to confirm and finish: " + string2,
          FR: "Bonjour " + string1 + ", merci d'avoir choisi notre plateforme WhatsApp. Une dernière chose, veuillez utiliser ce lien pour confirmer et terminer: " + string2,
        },
        1051: {
          EN: "Welcome back. Please select the groups that you're interested in.",
          FR: "Nous saluons le retour. Veuillez sélectionner les groupes qui vous intéressent.",
        },
        1052: {
          EN: "Opt-in complete. Thanks again.",
          FR: "Opt-in complet. Merci encore.",
        },
        1060: {
          EN: "Thanks " + string1 + ". Opt-in to " + string2 + " WhatsApp platform compeleted successfully.",
          FR: "Merci " + string1 + ". Activez la plateforme " + string2 + " WhatsApp avec succès",
        },
        1070: {
          EN: "With a sad face, we ask for one last thing to confirm your Opt-Out of <br> <b>" + string1 + "'s</b> <b>" + string2 + "</b> WhatsApp group:",
          FR: "Avec un visage triste, nous demandons une dernière chose pour confirmer votre désabonnement au <br> <b>" + string1 + "'s</b> <b>" + string2 + "</b> groupe WhatsApp:",
        },
        1071: {
          EN: "\n\nTo Opt Out from this particular message list, kindly click: " + string1,
          FR: "\n\nPour vous désinscrire de cette liste de messages particulière, veuillez cliquer sur:" + string1,
        },
        1080: {
          EN: "Opt-out complete. Thanks.",
          FR: "Désinscription terminée. Merci.",
        },
        1081: {
          EN: "Opt-in completed successfully. Thanks.",
          FR: "L'abonnement s'est terminé avec succés. Merci.",
        },
        1090: {
          EN: "With a sad face, we ask for one last thing to confirm your Opt-Out of <br> <b>" + string1 + "'s</b> <b>" + string2 + "</b> SMS group:",
          FR: "Avec un visage triste, nous demandons une dernière chose pour confirmer votre désabonnement au <br> <b>" + string1 + "'s</b> <b>" + string2 + "</b> groupe SMS:",
        },
        1091: {
          EN: "\n\nTo unsubscribe, click: https://dev2.tracksend.co/sms/optout/" + string1,
          FR: "\n\nPour vous désinscrire, cliquez sur: https://dev2.tracksend.co/sms/optout/" + string1,
        },
        1092: {
          EN: "\n\nTo subscribe, click: https://dev2.tracksend.co/sms/optin/" + string1,
          FR: "\n\nPour vous abonner, cliquez sur: https://dev2.tracksend.co/sms/optin/" + string1,
        },
        1100: {
          EN: "",
          FR: "",
        },
        1110: {
          EN: "",
          FR: "",
        },
        1120: {
          EN: "",
          FR: "",
        },
        1130: {
          EN: "",
          FR: "",
        },
        1140: {
          EN: "",
          FR: "",
        },
        1150: {
          EN: "",
          FR: "",
        },
      },
      console: {
        1010: {
          EN: "",
          FR: "",
        },
        1020: {
          EN: "",
          FR: "",
        },
        1030: {
          EN: "",
          FR: "",
        },
        1040: {
          EN: "",
          FR: "",
        },
        1050: {
          EN: "",
          FR: "",
        },
        1060: {
          EN: "",
          FR: "",
        },
        1070: {
          EN: "",
          FR: "",
        },
        1080: {
          EN: "",
          FR: "",
        },
        1090: {
          EN: "",
          FR: "",
        },
        1100: {
          EN: "",
          FR: "",
        },
        1110: {
          EN: "",
          FR: "",
        },
        1120: {
          EN: "",
          FR: "",
        },
        1130: {
          EN: "",
          FR: "",
        },
        1140: {
          EN: "",
          FR: "",
        },
        1150: {
          EN: "",
          FR: "",
        },
      },

    }

    return messagebank[type][msgcode][lang];
}

module.exports = _message;
