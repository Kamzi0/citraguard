import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import {
  db,
} from "../firebase.js";


export async function syncCitraGuardDataToFirestore(
  completedScans,
  monitoringAreas
) {
  const batch =
    writeBatch(
      db
    );


  completedScans.forEach(
    (scan) => {
      if (
        !scan.scanId
      ) {
        return;
      }

      const scanReference =
        doc(
          db,
          "scans",
          scan.scanId
        );

      batch.set(
        scanReference,
        {
          ...scan,

          cloudUpdatedAt:
            serverTimestamp(),
        },
        {
          merge:
            true,
        }
      );
    }
  );


  monitoringAreas.forEach(
    (area) => {
      if (
        !area.areaId
      ) {
        return;
      }

      const areaReference =
        doc(
          db,
          "monitoringAreas",
          area.areaId
        );

      batch.set(
        areaReference,
        {
          ...area,

          cloudUpdatedAt:
            serverTimestamp(),
        },
        {
          merge:
            true,
        }
      );
    }
  );


  await batch.commit();


  await setDoc(
    doc(
      db,
      "system",
      "sync-status"
    ),
    {
      application:
        "CitraGuard",

      scanCount:
        completedScans.length,

      monitoringAreaCount:
        monitoringAreas.length,

      lastSyncedAt:
        serverTimestamp(),
    },
    {
      merge:
        true,
    }
  );
}


export async function loadCitraGuardDataFromFirestore() {
  const scansSnapshot =
    await getDocs(
      collection(
        db,
        "scans"
      )
    );


  const areasSnapshot =
    await getDocs(
      collection(
        db,
        "monitoringAreas"
      )
    );


  const completedScans =
    scansSnapshot.docs.map(
      (documentSnapshot) => ({
        ...documentSnapshot.data(),

        scanId:
          documentSnapshot.data().scanId ??
          documentSnapshot.id,
      })
    );


  const monitoringAreas =
    areasSnapshot.docs.map(
      (documentSnapshot) => ({
        ...documentSnapshot.data(),

        areaId:
          documentSnapshot.data().areaId ??
          documentSnapshot.id,
      })
    );


  completedScans.sort(
    (firstScan, secondScan) => {
      const firstTime =
        new Date(
          firstScan.createdAt ?? 0
        ).getTime();

      const secondTime =
        new Date(
          secondScan.createdAt ?? 0
        ).getTime();


      return (
        secondTime -
        firstTime
      );
    }
  );


  monitoringAreas.sort(
    (firstArea, secondArea) => {
      const firstTime =
        new Date(
          firstArea.lastUpdated ??
            firstArea.createdAt ??
            0
        ).getTime();

      const secondTime =
        new Date(
          secondArea.lastUpdated ??
            secondArea.createdAt ??
            0
        ).getTime();


      return (
        secondTime -
        firstTime
      );
    }
  );


  return {
    completedScans,
    monitoringAreas,
  };
}