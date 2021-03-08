import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HttpErrorResponse} from "@angular/common/http/src/response";
import { ActivatedRoute } from '@angular/router';

declare const AutoScript: any;
declare const Constants: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'app';

  apiToken: string;

  sessionId: string;

  errorMessage: string;

  JSON;

  externalServerApiExample: JSON;

  userWS: String;

  logoutSuccess: boolean;

  authServerApiExample: string;

  constructor(private httpClient: HttpClient,
      private route: ActivatedRoute) {

    this.JSON = JSON;
    this.route.queryParams.subscribe(params => {
        this.setSessionCookie(params['sessionId']);
    });
  }

  ngOnInit(): void {
    AutoScript.httpClient = this.httpClient;
    AutoScript.cargarAppAfirma();
    AutoScript.setServlets(Constants.URL_BASE_SERVICES + "/afirma-signature-storage/StorageService", Constants.URL_BASE_SERVICES + "/afirma-signature-retriever/RetrieveService");
  }

  setSessionCookie(sessionId: string) {
    if (sessionId != undefined && sessionId != "") {
      console.log('SessionId: ' + sessionId);
      //document.cookie = "JSESSIONID=" + sessionId;
      this.sessionId = sessionId;
    }
  }

  parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

  handleTokenSuccess(apiToken: string) {
    const payload = this.parseJwt(apiToken);

    console.log(payload);

    localStorage.setItem("apiToken", apiToken);
    this.apiToken = apiToken;
    this.errorMessage = null;
  }

  handleTokenError(error: HttpErrorResponse) {
    this.errorMessage = JSON.stringify(error);
  }

  postLogin() {
    let usuarioTrewa = {};
    usuarioTrewa["apellidos"] = null;
    usuarioTrewa["identificador"] = null;
    usuarioTrewa["jndi"] = null;
    usuarioTrewa["nombre"] = null;
    usuarioTrewa["password"] = 'juange';
    usuarioTrewa["passwordCredencial"] = null;
    usuarioTrewa["perfiles"] = null;
    usuarioTrewa["sistema"] = null;
    usuarioTrewa["usuario"] = 'juange';
    usuarioTrewa["usuarioCredencial"] = null;

    this.httpClient.post("/backend_auth/auth/login", usuarioTrewa,
      {
        withCredentials: true,
        responseType: 'text'
      }
      ).subscribe(
        r => { this.setSessionCookie(r)},
        error => this.handleTokenError(error));
  }

  postLoginWS() {
    const formData = new FormData();
    formData.append("username", "99999999R");
    formData.append("password", "asdfasdfA1");

    this.httpClient.post("/backend_auth/auth/loginWS", formData,
      {
        withCredentials: true,
        responseType: 'text'
      }
      ).subscribe(
        r => { this.userWS = r},
        error => this.handleTokenError(error));
  }

  getToken() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend_auth/auth/token', {
      responseType: 'text',
    }).subscribe(
        r => this.handleTokenSuccess(r),
        error => this.handleTokenError(error));
  }

  callApiAuthServer() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend_auth/api/hello', {
      responseType: 'text',
      withCredentials : true,
      headers: {
        "Authorization": apiToken != null ? apiToken : ''
      }
    }).subscribe(
      r => this.authServerApiExample = r,
      error => this.handleTokenError(error)
      );
  }

  callApiExternal() {
    let apiToken = localStorage.getItem("apiToken");

    let cola = Math.floor(Math.random() * 2) + 1;

    this.httpClient.get<JSON>('/backend/siraoNt/getSiraoNt/1', {
      headers: {
        "Authorization": apiToken ? apiToken : ""
      }
    }).subscribe(r => this.externalServerApiExample = r);
  }

  callApiPostExternal() {
    let apiToken = localStorage.getItem("apiToken");

    let newObj = this.externalServerApiExample;
    newObj["idNt"] = null;

    AutoScript.httpClient.post("/backend/siraoNt/saveSiraoNt", newObj,
      {
        withCredentials: true,
        headers: {
          "Authorization": apiToken != null ? apiToken : ''
        }
      }
      ).subscribe(
        r => { console.log(r)},
        error => console.log(error));

    console.log("Firma OK");
  }

  certificateLogin() {
    window.location.href="/backend_auth/servlet/afirma/login";
  }

  samlLogin() {
    window.location.href="/backend_auth/saml/login";
  }

  logout() {
    console.log('logout');
    localStorage.removeItem('apiToken');
    this.httpClient.get('/backend_auth/saml/logout').subscribe(() => this.logoutSuccess = true);
  }

  descargarPDFBase64() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend/test/toPDFBase64', {
      headers: {
        "Authorization": apiToken
      },
      responseType: 'text'
    }).subscribe(r => {
      const source = `data:application/pdf;base64,${r}`;
      const link = document.createElement("a");
      link.href = source;
      link.download = "aaaa_resultado.pdf";
      link.click();
    });
  }

  descargarPDFBlob() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend/test/toPDF', {
      headers: {
        "Authorization": apiToken
      },
      responseType: 'blob'
    }).subscribe(r => {
      var newBlob = new Blob([r], { type: "application/pdf" });
      const data = window.URL.createObjectURL(newBlob);
      const link = document.createElement("a");
      link.href = data;
      link.download = "aaaa_resultado.pdf";
      link.click();
    });
  }

  firmarPDF() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend/test/toPDFBase64', {
      headers: {
        "Authorization": apiToken
      },
      responseType: 'text'
    }).subscribe(r => this.doFirmarPDF(r));
  }

  doFirmarPDF(base64data) {
    try {
      var params = "signaturePositionOnPageLowerLeftX = 100\n" +
            "signaturePositionOnPageLowerLeftY = 25\n" +
            "signaturePositionOnPageUpperRightX = 500\n" +
            "signaturePositionOnPageUpperRightY = 50\n" +
            "signaturePage = -1\n";

      /*AutoScript.signAndSaveToFile (
        "sign",
        base64data,
        "SHA1withRSA",
        "AUTO",
        params,
        null,
        showSignResultCallback,
        showErrorCallback);*/

        AutoScript.sign(
					base64data,
					"SHA1withRSA",
					"AUTO",
					params,
					this.showSignResultCallback,
					this.showErrorCallback);

    } catch(e) {
      try {
        console.log("Type: " + AutoScript.getErrorType() + "\nMessage: " + AutoScript.getErrorMessage());
        console.log("Error: " + e);
      } catch(ex) {
        console.log("Error: " + e);
        console.log("Error: " + ex);
      }
    }
  }

  showSignResultCallback(docSignedBase64) {

    // Para descargarlo
    const source = `data:application/pdf;base64,${docSignedBase64}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = "aaaa_resultado.pdf";
    link.click();

    // Para enviarlo al servidor
    /*let apiToken = localStorage.getItem("apiToken");

    const formData = new FormData();
    formData.append("file", docSignedBase64);

    AutoScript.httpClient.post("/backend/api/file/base64", formData,
      {
        withCredentials: true,
        headers: {
          "Authorization": apiToken != null ? apiToken : ''
        }
      }
      ).subscribe(
        r => { console.log(r)},
        error => console.log(error));*/

    console.log("Firma OK");
  }

  showErrorCallback(errorType, errorMessage) {
    console.log("Type: " + errorType + "\nMessage: " + errorMessage);
  }

  onFileSelect(event) {
    var selectedFile = event.target.files[0];
    console.log(selectedFile.name);

    let apiToken = localStorage.getItem("apiToken");
    const formData = new FormData();
    formData.append("file", selectedFile, selectedFile.name);

    this.httpClient.post("http://localhost:8082/file/api/file", formData,
      {
        withCredentials: true,
        headers: {
          "Authorization": apiToken != null ? apiToken : ''
         // "Content-Type": "multipart/form-data"
        }
      }
      ).subscribe(
        r => { console.log(r)},
        error => console.log(error));
  }

}
